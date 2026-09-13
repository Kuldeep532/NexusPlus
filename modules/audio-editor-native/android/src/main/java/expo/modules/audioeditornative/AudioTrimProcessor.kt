package expo.modules.audioeditornative

import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMuxer
import java.io.File
import java.nio.ByteBuffer

internal object AudioTrimProcessor {
  fun trim(
    inputPath: String,
    outputPath: String,
    startMs: Double,
    endMs: Double,
  ): Map<String, Any?> {
    require(startMs.isFinite() && endMs.isFinite()) { "Trim bounds must be finite." }
    require(startMs >= 0.0) { "Trim start must be at least 0 ms." }
    require(endMs > startMs) { "Trim end must be greater than trim start." }
    require(File(inputPath).isFile) { "Input audio file was not found." }

    val destination = File(outputPath)
    destination.parentFile?.mkdirs()
    if (destination.exists()) require(destination.delete()) { "Unable to replace existing output file." }

    val extractor = MediaExtractor()
    var muxer: MediaMuxer? = null
    var started = false
    try {
      extractor.setDataSource(inputPath)
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

      extractor.selectTrack(audioTrack)
      val startUs = (startMs * 1000.0).toLong()
      val endUs = (endMs * 1000.0).toLong()
      extractor.seekTo(startUs, MediaExtractor.SEEK_TO_CLOSEST_SYNC)

      muxer = MediaMuxer(outputPath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
      val outputTrack = muxer.addTrack(format)
      muxer.start()
      started = true

      val maxInput = if (format.containsKey(MediaFormat.KEY_MAX_INPUT_SIZE)) {
        format.getInteger(MediaFormat.KEY_MAX_INPUT_SIZE)
      } else {
        256 * 1024
      }
      val buffer = ByteBuffer.allocateDirect(maxOf(maxInput, 64 * 1024))
      val info = MediaCodec.BufferInfo()
      var samples = 0

      while (true) {
        buffer.clear()
        val timeUs = extractor.sampleTime
        if (timeUs < 0 || timeUs >= endUs) break
        val size = extractor.readSampleData(buffer, 0)
        if (size < 0) break
        info.set(0, size, (timeUs - startUs).coerceAtLeast(0L), extractor.sampleFlags)
        muxer.writeSampleData(outputTrack, buffer, info)
        samples++
        extractor.advance()
      }

      require(samples > 0) { "The selected range contains no writable audio samples." }
      return mapOf(
        "outputPath" to outputPath,
        "durationMs" to (endMs - startMs),
        "mimeType" to format.getString(MediaFormat.KEY_MIME),
        "samples" to samples,
      )
    } finally {
      if (started) try { muxer?.stop() } catch (_: Exception) { }
      muxer?.release()
      extractor.release()
    }
  }
}
