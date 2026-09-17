package expo.modules.audioeditornative

import android.content.Context
import android.media.MediaExtractor
import android.media.MediaMuxer
import android.net.Uri
import java.io.File
import java.nio.ByteBuffer

/** Copies every non-audio track into a new MP4 while omitting all audio tracks. */
internal object RemoveVideoAudioProcessor {
  fun process(context: Context, inputPath: String, outputPath: String): Map<String, Any?> {
    val destination = File(outputPath)
    destination.parentFile?.mkdirs()
    if (destination.exists()) require(destination.delete()) { "Unable to replace existing output video." }

    val extractor = MediaExtractor()
    var muxer: MediaMuxer? = null
    var started = false
    try {
      setDataSource(context, extractor, inputPath)
      val videoTracks = mutableListOf<Int>()
      for (index in 0 until extractor.trackCount) {
        val format = extractor.getTrackFormat(index)
        val mime = format.getString("mime") ?: continue
        if (mime.startsWith("video/")) videoTracks += index
      }
      require(videoTracks.isNotEmpty()) { "No video track was found." }

      muxer = MediaMuxer(outputPath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
      val outputTrackMap = mutableMapOf<Int, Int>()
      for (sourceTrack in videoTracks) {
        outputTrackMap[sourceTrack] = muxer.addTrack(extractor.getTrackFormat(sourceTrack))
        extractor.selectTrack(sourceTrack)
      }
      muxer.start()
      started = true

      val maxInputSize = videoTracks.maxOfOrNull { index ->
        val format = extractor.getTrackFormat(index)
        if (format.containsKey("max-input-size")) format.getInteger("max-input-size") else 1024 * 1024
      } ?: 1024 * 1024
      val buffer = ByteBuffer.allocateDirect(maxOf(maxInputSize, 64 * 1024))
      val info = android.media.MediaCodec.BufferInfo()
      var writtenSamples = 0

      while (true) {
        buffer.clear()
        val sourceTrack = extractor.sampleTrackIndex
        val timeUs = extractor.sampleTime
        if (sourceTrack < 0 || timeUs < 0L) break
        val size = extractor.readSampleData(buffer, 0)
        if (size < 0) break
        val outputTrack = outputTrackMap[sourceTrack]
        if (outputTrack != null) {
          info.set(0, size, timeUs, extractor.sampleFlags)
          muxer.writeSampleData(outputTrack, buffer, info)
          writtenSamples++
        }
        extractor.advance()
      }

      require(writtenSamples > 0) { "The video track contains no writable samples." }
      val durationMs = videoTracks.mapNotNull { index ->
        val format = extractor.getTrackFormat(index)
        if (format.containsKey("durationUs")) format.getLong("durationUs") / 1000.0 else null
      }.maxOrNull()

      return mapOf(
        "outputPath" to outputPath,
        "durationMs" to durationMs,
        "videoTracks" to videoTracks.size,
        "audioRemoved" to true,
        "samples" to writtenSamples,
        "mimeType" to "video/mp4",
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
