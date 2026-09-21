package expo.modules.audioeditornative

import android.content.Context
import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMuxer
import android.net.Uri
import java.io.File
import java.nio.ByteBuffer
import kotlin.math.max
import kotlin.math.roundToLong

internal object AudioTrimProcessor {
  fun trim(
    context: Context?,
    inputPath: String,
    outputPath: String,
    startMs: Double,
    endMs: Double,
  ): Map<String, Any?> {
    require(context != null) { "Audio editor context is unavailable." }
    require(startMs.isFinite() && endMs.isFinite()) { "Trim bounds must be finite." }
    require(startMs >= 0.0) { "Trim start must be at least 0 ms." }
    require(endMs > startMs) { "Trim end must be greater than trim start." }

    val destination = File(outputPath)
    destination.parentFile?.mkdirs()
    if (destination.exists()) require(destination.delete()) { "Unable to replace existing output file." }

    val extractor = MediaExtractor()
    var muxer: MediaMuxer? = null
    var started = false

    try {
      setDataSource(context, extractor, inputPath)

      var audioTrack = -1
      var format: MediaFormat? = null
      for (index in 0 until extractor.trackCount) {
        val candidate = extractor.getTrackFormat(index)
        val mime = candidate.getString(MediaFormat.KEY_MIME) ?: continue
        if (mime.startsWith("audio/")) {
          audioTrack = index
          format = candidate
          break
        }
      }
      require(audioTrack >= 0 && format != null) { "No supported audio track was found." }

      val sourceDurationUs = if (format.containsKey(MediaFormat.KEY_DURATION)) {
        format.getLong(MediaFormat.KEY_DURATION)
      } else {
        0L
      }
      val requestedStartUs = (startMs * 1000.0).roundToLong()
      val requestedEndUs = (endMs * 1000.0).roundToLong()

      require(requestedStartUs < requestedEndUs) { "Trim end must be greater than trim start." }
      if (sourceDurationUs > 0L) {
        require(requestedStartUs < sourceDurationUs) { "Trim start is outside the source duration." }
        require(requestedEndUs <= sourceDurationUs) { "Trim end is outside the source duration." }
      }

      extractor.selectTrack(audioTrack)

      /*
       * MediaExtractor can only seek to sync samples. Seek to the closest sample,
       * then keep only samples whose original timestamps fall inside the requested
       * interval. This avoids exporting content before the requested start because
       * SEEK_TO_CLOSEST_SYNC may land on an earlier sample.
       */
      extractor.seekTo(requestedStartUs, MediaExtractor.SEEK_TO_CLOSEST_SYNC)

      val firstSampleUs = findFirstSampleAtOrAfter(extractor, requestedStartUs, requestedEndUs)
      require(firstSampleUs >= 0L) { "The selected range contains no writable audio samples." }

      muxer = MediaMuxer(outputPath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
      val outputTrack = muxer.addTrack(format)
      muxer.start()
      started = true

      val maxInput = if (format.containsKey(MediaFormat.KEY_MAX_INPUT_SIZE)) {
        format.getInteger(MediaFormat.KEY_MAX_INPUT_SIZE)
      } else {
        256 * 1024
      }
      val buffer = ByteBuffer.allocateDirect(max(maxInput, 64 * 1024))
      val info = MediaCodec.BufferInfo()
      var samples = 0
      var lastWrittenTimeUs = -1L

      while (true) {
        buffer.clear()
        val timeUs = extractor.sampleTime
        if (timeUs < 0L || timeUs >= requestedEndUs) break

        val size = extractor.readSampleData(buffer, 0)
        if (size < 0) break

        /*
         * Never write negative presentation timestamps. Preserve the relative
         * spacing from the first actual sample written to the output.
         */
        val outputTimeUs = (timeUs - firstSampleUs).coerceAtLeast(0L)
        if (outputTimeUs < lastWrittenTimeUs) {
          extractor.advance()
          continue
        }

        info.set(
          0,
          size,
          outputTimeUs,
          extractor.sampleFlags,
        )
        muxer.writeSampleData(outputTrack, buffer, info)
        lastWrittenTimeUs = outputTimeUs
        samples++
        extractor.advance()
      }

      require(samples > 0) { "The selected range contains no writable audio samples." }

      val actualDurationMs = (lastWrittenTimeUs + estimateSampleDurationUs(format)).toDouble() / 1000.0

      return mapOf(
        "outputPath" to outputPath,
        "startMs" to startMs,
        "endMs" to endMs,
        "durationMs" to minOf(endMs - startMs, actualDurationMs.coerceAtLeast(0.0)),
        "mimeType" to format.getString(MediaFormat.KEY_MIME),
        "samples" to samples,
      )
    } finally {
      if (started) {
        try { muxer?.stop() } catch (_: Exception) { }
      }
      muxer?.release()
      extractor.release()
    }
  }

  private fun findFirstSampleAtOrAfter(
    extractor: MediaExtractor,
    requestedStartUs: Long,
    requestedEndUs: Long,
  ): Long {
    var sampleTimeUs = extractor.sampleTime
    while (sampleTimeUs >= 0L && sampleTimeUs < requestedStartUs) {
      extractor.advance()
      sampleTimeUs = extractor.sampleTime
    }
    return if (sampleTimeUs in requestedStartUs until requestedEndUs) sampleTimeUs else -1L
  }

  private fun estimateSampleDurationUs(format: MediaFormat): Long {
    if (format.containsKey(MediaFormat.KEY_SAMPLE_RATE)) {
      val sampleRate = format.getInteger(MediaFormat.KEY_SAMPLE_RATE)
      if (sampleRate > 0 && format.containsKey(MediaFormat.KEY_CHANNEL_COUNT)) {
        /*
         * Encoded audio sample durations vary by codec; 20 ms is only a conservative
         * upper bound used for the returned metadata, not for muxing/timestamps.
         */
        return 20_000L
      }
    }
    return 0L
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
