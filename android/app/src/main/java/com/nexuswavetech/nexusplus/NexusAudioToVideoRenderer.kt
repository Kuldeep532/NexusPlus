package com.nexuswavetech.nexusplus

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMuxer
import android.net.Uri
import android.view.Surface
import java.io.File
import java.nio.ByteBuffer
import java.util.concurrent.TimeUnit

internal object NexusAudioToVideoRenderer {
    data class ImageSpec(val uri: String, val durationMs: Double)

    fun render(
        context: Context,
        audioPath: String,
        images: List<ImageSpec>,
        outputPath: String,
    ): Map<String, Any?> {
        require(audioPath.isNotBlank()) { "Audio source is required." }
        require(images.isNotEmpty()) { "At least one image is required." }
        require(images.all { it.durationMs > 0.0 && it.durationMs.isFinite() }) { "Image durations must be positive and finite." }

        val destination = File(outputPath)
        destination.parentFile?.mkdirs()
        if (destination.exists()) require(destination.delete()) { "Unable to replace existing output file." }

        val audio = openAudio(context, audioPath)
        var videoEncoder: MediaCodec? = null
        var surface: Surface? = null
        var muxer: MediaMuxer? = null
        var muxerStarted = false
        try {
            val audioDurationUs = audio.durationUs
            val requestedDurationUs = images.sumOf { (it.durationMs * 1000.0).toLong() }
            require(audioDurationUs > 0L) { "Audio duration could not be determined." }
            require(kotlin.math.abs(requestedDurationUs - audioDurationUs) <= 5_000L) {
                "Image timing must exactly cover the selected audio duration."
            }

            val width = 1280
            val height = 720
            val videoFormat = MediaFormat.createVideoFormat("video/avc", width, height)
            videoFormat.setInteger(MediaFormat.KEY_COLOR_FORMAT, MediaCodecInfo.CodecCapabilities.COLOR_FormatSurface)
            videoFormat.setInteger(MediaFormat.KEY_BIT_RATE, 2_500_000)
            videoFormat.setInteger(MediaFormat.KEY_FRAME_RATE, 30)
            videoFormat.setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, 1)

            videoEncoder = MediaCodec.createEncoderByType("video/avc")
            videoEncoder.configure(videoFormat, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
            surface = videoEncoder.createInputSurface()
            videoEncoder.start()

            muxer = MediaMuxer(outputPath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
            val audioTrack = muxer.addTrack(audio.format)
            var videoTrack = -1
            val info = MediaCodec.BufferInfo()

            val drawCanvas = surface.lockCanvas(null)
            try {
                drawCanvas.drawColor(android.graphics.Color.BLACK)
            } finally {
                surface.unlockCanvasAndPost(drawCanvas)
            }

            var presentationUs = 0L
            var encodedFrames = 0
            val frameStepUs = 1_000_000L / 30L

            for (image in images) {
                val bitmap = decodeBitmap(context, image.uri) ?: error("Unable to decode image: ${image.uri}")
                val targetDurationUs = (image.durationMs * 1000.0).toLong()
                val targetEndUs = presentationUs + targetDurationUs
                while (presentationUs < targetEndUs) {
                    drawBitmap(surface, bitmap, width, height)
                    val ptsUs = presentationUs
                    try { Thread.sleep(0, 1_000_000) } catch (_: InterruptedException) { Thread.currentThread().interrupt() }
                    drainEncoder(videoEncoder, info, muxer, { track ->
                        if (videoTrack < 0) {
                            videoTrack = track
                            if (!muxerStarted) {
                                muxer.start()
                                muxerStarted = true
                            }
                        }
                    })
                    presentationUs += frameStepUs
                    encodedFrames++
                }
                bitmap.recycle()
            }

            videoEncoder.signalEndOfInputStream()
            var endOfStream = false
            val deadlineNs = System.nanoTime() + TimeUnit.SECONDS.toNanos(15)
            while (!endOfStream && System.nanoTime() < deadlineNs) {
                val outputIndex = videoEncoder.dequeueOutputBuffer(info, 10_000L)
                when {
                    outputIndex == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
                        if (videoTrack >= 0) error("Video output format changed more than once.")
                        videoTrack = muxer.addTrack(videoEncoder.outputFormat)
                        if (!muxerStarted) {
                            muxer.start()
                            muxerStarted = true
                        }
                    }
                    outputIndex >= 0 -> {
                        val buffer = videoEncoder.getOutputBuffer(outputIndex)
                        if (buffer != null && info.size > 0 && (info.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG) == 0) {
                            require(muxerStarted) { "Video muxer has not started." }
                            buffer.position(info.offset)
                            buffer.limit(info.offset + info.size)
                            muxer.writeSampleData(videoTrack, buffer, info)
                        }
                        endOfStream = (info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0
                        videoEncoder.releaseOutputBuffer(outputIndex, false)
                    }
                }
            }

            require(videoTrack >= 0 && muxerStarted && encodedFrames > 0) { "The video encoder produced no output." }
            copyAudioSamples(context, audio.extractor, audio.audioTrack, muxer, audioTrack, presentationUs.coerceAtMost(audioDurationUs))

            return mapOf(
                "outputUri" to outputPath,
                "durationMs" to audioDurationUs / 1000.0,
                "mimeType" to "video/mp4",
            )
        } finally {
            try { audio.extractor.release() } catch (_: Exception) { }
            try { videoEncoder?.stop() } catch (_: Exception) { }
            try { videoEncoder?.release() } catch (_: Exception) { }
            try { surface?.release() } catch (_: Exception) { }
            if (muxerStarted) try { muxer?.stop() } catch (_: Exception) { }
            muxer?.release()
        }
    }

    private data class OpenAudio(
        val extractor: MediaExtractor,
        val audioTrack: Int,
        val format: MediaFormat,
        val durationUs: Long,
    )

    private fun openAudio(context: Context, path: String): OpenAudio {
        val extractor = MediaExtractor()
        setDataSource(context, extractor, path)
        for (i in 0 until extractor.trackCount) {
            val format = extractor.getTrackFormat(i)
            val mime = format.getString(MediaFormat.KEY_MIME) ?: continue
            if (!mime.startsWith("audio/")) continue
            val duration = if (format.containsKey(MediaFormat.KEY_DURATION)) format.getLong(MediaFormat.KEY_DURATION) else 0L
            extractor.selectTrack(i)
            return OpenAudio(extractor, i, format, duration)
        }
        extractor.release()
        error("No supported audio track was found.")
    }

    private fun copyAudioSamples(
        context: Context,
        extractor: MediaExtractor,
        audioTrack: Int,
        muxer: MediaMuxer,
        outputTrack: Int,
        maxDurationUs: Long,
    ) {
        extractor.seekTo(0L, MediaExtractor.SEEK_TO_CLOSEST_SYNC)
        val maxInput = if (extractor.getTrackFormat(audioTrack).containsKey(MediaFormat.KEY_MAX_INPUT_SIZE)) extractor.getTrackFormat(audioTrack).getInteger(MediaFormat.KEY_MAX_INPUT_SIZE) else 256 * 1024
        val buffer = ByteBuffer.allocateDirect(maxOf(64 * 1024, maxInput))
        val info = MediaCodec.BufferInfo()
        while (true) {
            buffer.clear()
            val timeUs = extractor.sampleTime
            if (timeUs < 0L || timeUs >= maxDurationUs) break
            val size = extractor.readSampleData(buffer, 0)
            if (size <= 0) break
            info.set(0, size, timeUs, extractor.sampleFlags)
            muxer.writeSampleData(outputTrack, buffer, info)
            extractor.advance()
        }
    }

    private fun drainEncoder(
        encoder: MediaCodec,
        info: MediaCodec.BufferInfo,
        muxer: MediaMuxer,
        onFormat: (Int) -> Unit,
    ) {
        while (true) {
            val outputIndex = encoder.dequeueOutputBuffer(info, 0L)
            when {
                outputIndex == MediaCodec.INFO_TRY_AGAIN_LATER -> return
                outputIndex == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
                    val track = muxer.addTrack(encoder.outputFormat)
                    onFormat(track)
                }
                outputIndex >= 0 -> {
                    val buffer = encoder.getOutputBuffer(outputIndex)
                    if (buffer != null && info.size > 0 && (info.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG) == 0) {
                        buffer.position(info.offset)
                        buffer.limit(info.offset + info.size)
                    }
                    encoder.releaseOutputBuffer(outputIndex, false)
                }
            }
        }
    }

    private fun drawBitmap(surface: Surface, source: Bitmap, width: Int, height: Int) {
        val canvas = surface.lockCanvas(null)
        try {
            canvas.drawColor(android.graphics.Color.BLACK)
            val src = android.graphics.Rect(0, 0, source.width, source.height)
            val scale = minOf(width.toFloat() / source.width, height.toFloat() / source.height)
            val drawWidth = (source.width * scale).toInt()
            val drawHeight = (source.height * scale).toInt()
            val left = (width - drawWidth) / 2
            val top = (height - drawHeight) / 2
            val dst = android.graphics.Rect(left, top, left + drawWidth, top + drawHeight)
            canvas.drawBitmap(source, src, dst, null)
        } finally {
            surface.unlockCanvasAndPost(canvas)
        }
    }

    private fun decodeBitmap(context: Context, uriString: String): Bitmap? {
        val uri = Uri.parse(uriString)
        return context.contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it) }
            ?: if (File(uriString).isFile) BitmapFactory.decodeFile(uriString) else null
    }

    private fun setDataSource(context: Context, extractor: MediaExtractor, inputPath: String) {
        when {
            inputPath.startsWith("content://") || inputPath.startsWith("file://") -> {
                val uri = Uri.parse(inputPath)
                context.contentResolver.openFileDescriptor(uri, "r").use { descriptor ->
                    requireNotNull(descriptor) { "Unable to open selected audio file." }
                    extractor.setDataSource(descriptor.fileDescriptor)
                }
            }
            File(inputPath).isFile -> extractor.setDataSource(inputPath)
            else -> throw IllegalArgumentException("Input audio file was not found.")
        }
    }
}
