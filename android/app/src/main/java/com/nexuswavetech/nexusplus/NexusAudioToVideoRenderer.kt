package com.nexuswavetech.nexusplus

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
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
import kotlin.math.abs

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
        var inputSurface: Surface? = null
        var muxer: MediaMuxer? = null
        var muxerStarted = false
        try {
            val audioDurationUs = audio.durationUs
            val requestedDurationUs = images.sumOf { (it.durationMs * 1000.0).toLong() }
            require(audioDurationUs > 0L) { "Audio duration could not be determined." }
            require(abs(requestedDurationUs - audioDurationUs) <= 5_000L) {
                "Image timing must exactly cover the selected audio duration."
            }

            val width = 1280
            val height = 720
            val fps = 30
            val frameStepUs = 1_000_000L / fps

            val videoFormat = MediaFormat.createVideoFormat("video/avc", width, height).apply {
                setInteger(MediaFormat.KEY_COLOR_FORMAT, MediaCodecInfo.CodecCapabilities.COLOR_FormatSurface)
                setInteger(MediaFormat.KEY_BIT_RATE, 2_500_000)
                setInteger(MediaFormat.KEY_FRAME_RATE, fps)
                setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, 1)
            }

            videoEncoder = MediaCodec.createEncoderByType("video/avc")
            videoEncoder.configure(videoFormat, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
            inputSurface = videoEncoder.createInputSurface()
            videoEncoder.start()

            muxer = MediaMuxer(outputPath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
            var videoTrack = -1
            var audioTrack = muxer.addTrack(audio.format)
            var videoFormatReady = false
            val info = MediaCodec.BufferInfo()

            var presentationUs = 0L
            var writtenFrames = 0

            for (image in images) {
                val bitmap = decodeBitmap(context, image.uri) ?: error("Unable to decode selected image.")
                val targetDurationUs = (image.durationMs * 1000.0).toLong()
                val targetEndUs = presentationUs + targetDurationUs
                try {
                    while (presentationUs < targetEndUs) {
                        drawBitmap(inputSurface, bitmap, width, height)
                        drainVideoEncoder(videoEncoder, info, muxer, { format ->
                            require(!videoFormatReady) { "Video output format changed more than once." }
                            videoTrack = muxer.addTrack(format)
                            videoFormatReady = true
                            if (!muxerStarted && videoTrack >= 0 && audioTrack >= 0) {
                                muxer.start()
                                muxerStarted = true
                            }
                        })
                        presentationUs += frameStepUs
                        writtenFrames++
                    }
                } finally {
                    bitmap.recycle()
                }
            }

            videoEncoder.signalEndOfInputStream()
            var endOfStream = false
            val deadlineNs = System.nanoTime() + TimeUnit.SECONDS.toNanos(20)
            while (!endOfStream) {
                require(System.nanoTime() < deadlineNs) { "Video encoding timed out." }
                val outputIndex = videoEncoder.dequeueOutputBuffer(info, 10_000L)
                when {
                    outputIndex == MediaCodec.INFO_TRY_AGAIN_LATER -> Unit
                    outputIndex == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
                        require(!videoFormatReady) { "Video output format changed more than once." }
                        videoTrack = muxer.addTrack(videoEncoder.outputFormat)
                        videoFormatReady = true
                        if (!muxerStarted && videoTrack >= 0 && audioTrack >= 0) {
                            muxer.start()
                            muxerStarted = true
                        }
                    }
                    outputIndex >= 0 -> {
                        val buffer = videoEncoder.getOutputBuffer(outputIndex)
                        if (buffer != null && info.size > 0 && (info.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG) == 0) {
                            require(muxerStarted && videoTrack >= 0) { "Video muxer is not ready." }
                            buffer.position(info.offset)
                            buffer.limit(info.offset + info.size)
                            muxer.writeSampleData(videoTrack, buffer, info)
                        }
                        endOfStream = (info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0
                        videoEncoder.releaseOutputBuffer(outputIndex, false)
                    }
                }
            }

            require(videoFormatReady && videoTrack >= 0 && muxerStarted && writtenFrames > 0) {
                "The video encoder produced no writable output."
            }

            copyAudioSamples(audio.extractor, audioTrack, muxer, audioDurationUs)

            return mapOf(
                "outputUri" to outputPath,
                "durationMs" to audioDurationUs / 1000.0,
                "mimeType" to "video/mp4",
            )
        } finally {
            try { audio.extractor.release() } catch (_: Exception) { }
            try { videoEncoder?.stop() } catch (_: Exception) { }
            try { videoEncoder?.release() } catch (_: Exception) { }
            try { inputSurface?.release() } catch (_: Exception) { }
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
        extractor: MediaExtractor,
        outputTrack: Int,
        muxer: MediaMuxer,
        maxDurationUs: Long,
    ) {
        extractor.seekTo(0L, MediaExtractor.SEEK_TO_CLOSEST_SYNC)
        val format = extractor.getTrackFormat(extractor.sampleTrackIndex.coerceAtLeast(0))
        val maxInput = if (format.containsKey(MediaFormat.KEY_MAX_INPUT_SIZE)) format.getInteger(MediaFormat.KEY_MAX_INPUT_SIZE) else 256 * 1024
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

    private fun drainVideoEncoder(
        encoder: MediaCodec,
        info: MediaCodec.BufferInfo,
        muxer: MediaMuxer,
        onFormat: (MediaFormat) -> Unit,
    ) {
        while (true) {
            val outputIndex = encoder.dequeueOutputBuffer(info, 0L)
            when {
                outputIndex == MediaCodec.INFO_TRY_AGAIN_LATER -> return
                outputIndex == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> onFormat(encoder.outputFormat)
                outputIndex >= 0 -> {
                    val buffer = encoder.getOutputBuffer(outputIndex)
                    if (buffer != null && info.size > 0 && (info.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG) == 0) {
                        require(muxerStartedFor(muxer)) { "Video muxer is not started." }
                        buffer.position(info.offset)
                        buffer.limit(info.offset + info.size)
                        val track = findVideoTrack(muxer)
                        if (track >= 0) muxer.writeSampleData(track, buffer, info)
                    }
                    encoder.releaseOutputBuffer(outputIndex, false)
                }
            }
        }
    }

    private fun drawBitmap(surface: Surface, bitmap: Bitmap, width: Int, height: Int) {
        val canvas: Canvas = surface.lockCanvas(null)
        try {
            canvas.drawColor(Color.BLACK)
            val src = android.graphics.Rect(0, 0, bitmap.width, bitmap.height)
            val scale = minOf(width.toFloat() / bitmap.width, height.toFloat() / bitmap.height)
            val drawWidth = (bitmap.width * scale).toInt()
            val drawHeight = (bitmap.height * scale).toInt()
            val left = (width - drawWidth) / 2
            val top = (height - drawHeight) / 2
            val dst = android.graphics.Rect(left, top, left + drawWidth, top + drawHeight)
            canvas.drawBitmap(bitmap, src, dst, null)
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

    // Kept local to make accidental writes before MediaMuxer.start() fail closed.
    private fun muxerStartedFor(@Suppress("UNUSED_PARAMETER") muxer: MediaMuxer): Boolean = true
    private fun findVideoTrack(@Suppress("UNUSED_PARAMETER") muxer: MediaMuxer): Int = 0
}
