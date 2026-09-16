package com.nexuswavetech.nexusplus

import android.content.Context
import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMuxer
import android.net.Uri
import java.io.File
import java.nio.ByteBuffer

/**
 * Native video cutter: removes one middle segment and concatenates the media
 * samples before and after it into one MP4 output. No re-encoding is performed.
 * This keeps processing deterministic and avoids adding an FFmpeg dependency.
 */
internal object NexusVideoCutter {
    fun removeSegment(
        context: Context,
        inputPath: String,
        outputPath: String,
        removeStartMs: Double,
        removeEndMs: Double,
    ): Map<String, Any?> {
        require(removeStartMs.isFinite() && removeEndMs.isFinite()) { "Cut bounds must be finite." }
        require(removeStartMs >= 0.0) { "Cut start must be at least 0 ms." }
        require(removeEndMs > removeStartMs) { "Cut end must be greater than cut start." }

        val destination = File(outputPath)
        destination.parentFile?.mkdirs()
        if (destination.exists()) require(destination.delete()) { "Unable to replace existing output file." }

        val extractor = MediaExtractor()
        var muxer: MediaMuxer? = null
        var started = false
        try {
            setDataSource(context, extractor, inputPath)

            val trackMap = IntArray(extractor.trackCount) { -1 }
            var sourceDurationUs = 0L
            for (index in 0 until extractor.trackCount) {
                val format = extractor.getTrackFormat(index)
                trackMap[index] = index
                if (format.containsKey(MediaFormat.KEY_DURATION)) {
                    sourceDurationUs = maxOf(sourceDurationUs, format.getLong(MediaFormat.KEY_DURATION))
                }
            }
            require(extractor.trackCount > 0) { "No media tracks were found." }
            val cutStartUs = (removeStartMs * 1000.0).toLong()
            val cutEndUs = (removeEndMs * 1000.0).toLong()
            require(cutEndUs > cutStartUs) { "Cut end must be greater than cut start." }
            if (sourceDurationUs > 0L) {
                require(cutStartUs < sourceDurationUs) { "Cut start is outside the source duration." }
                require(cutEndUs <= sourceDurationUs) { "Cut end exceeds the source duration." }
            }

            muxer = MediaMuxer(outputPath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
            val outputTracks = IntArray(extractor.trackCount) { -1 }
            for (index in 0 until extractor.trackCount) {
                outputTracks[index] = muxer.addTrack(extractor.getTrackFormat(index))
                extractor.selectTrack(index)
            }
            muxer.start()
            started = true

            val maxInputSize = (0 until extractor.trackCount).maxOfOrNull { index ->
                val format = extractor.getTrackFormat(index)
                if (format.containsKey(MediaFormat.KEY_MAX_INPUT_SIZE)) format.getInteger(MediaFormat.KEY_MAX_INPUT_SIZE) else 256 * 1024
            } ?: 256 * 1024
            val buffer = ByteBuffer.allocateDirect(maxOf(maxInputSize, 64 * 1024))
            val info = MediaCodec.BufferInfo()
            val offsetsUs = LongArray(extractor.trackCount)
            var writtenSamples = 0
            var seenPostCut = false

            while (true) {
                buffer.clear()
                val trackIndex = extractor.sampleTrackIndex
                val sampleTimeUs = extractor.sampleTime
                if (trackIndex < 0 || sampleTimeUs < 0L) break
                val size = extractor.readSampleData(buffer, 0)
                if (size < 0) break

                val inRemovedRange = sampleTimeUs >= cutStartUs && sampleTimeUs < cutEndUs
                if (!inRemovedRange) {
                    if (sampleTimeUs >= cutEndUs) seenPostCut = true
                    val outputTimeUs = if (sampleTimeUs >= cutEndUs) {
                        val cutDurationUs = cutEndUs - cutStartUs
                        (sampleTimeUs - cutDurationUs).coerceAtLeast(0L)
                    } else {
                        sampleTimeUs
                    }
                    val previous = offsetsUs[trackIndex]
                    val normalizedTimeUs = if (previous > 0L && outputTimeUs < previous) previous else outputTimeUs
                    info.set(0, size, normalizedTimeUs, extractor.sampleFlags)
                    muxer.writeSampleData(outputTracks[trackIndex], buffer, info)
                    offsetsUs[trackIndex] = normalizedTimeUs
                    writtenSamples++
                }
                extractor.advance()
            }

            require(writtenSamples > 0) { "Removing that segment would leave no writable media samples." }
            return mapOf(
                "outputPath" to outputPath,
                "removedStartMs" to removeStartMs,
                "removedEndMs" to removeEndMs,
                "sourceDurationMs" to if (sourceDurationUs > 0L) sourceDurationUs / 1000.0 else null,
                "outputDurationMs" to if (sourceDurationUs > 0L) ((sourceDurationUs - (cutEndUs - cutStartUs)).coerceAtLeast(0L) / 1000.0) else null,
                "samples" to writtenSamples,
                "hadPostCutSamples" to seenPostCut,
            )
        } finally {
            if (started) try { muxer?.stop() } catch (_: Exception) { }
            muxer?.release()
            extractor.release()
        }
    }

    private fun setDataSource(context: Context, extractor: MediaExtractor, inputPath: String) {
        when {
            inputPath.startsWith("content://") || inputPath.startsWith("file://") -> {
                val uri = Uri.parse(inputPath)
                context.contentResolver.openFileDescriptor(uri, "r").use { descriptor ->
                    requireNotNull(descriptor) { "Unable to open selected video file." }
                    extractor.setDataSource(descriptor.fileDescriptor)
                }
            }
            File(inputPath).isFile -> extractor.setDataSource(inputPath)
            else -> throw IllegalArgumentException("Input video file was not found.")
        }
    }
}
