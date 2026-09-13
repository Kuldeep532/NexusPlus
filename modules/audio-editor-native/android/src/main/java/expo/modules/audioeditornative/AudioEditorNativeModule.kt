package expo.modules.audioeditornative

import android.media.MediaExtractor
import android.media.MediaFormat
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AudioEditorNativeModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AudioEditorNative")

    AsyncFunction("probe") { inputPath: String, promise: Promise ->
      try {
        promise.resolve(probeAudio(inputPath))
      } catch (error: Exception) {
        promise.reject("AUDIO_PROBE_FAILED", error.message ?: "Unable to inspect audio", error)
      }
    }

    AsyncFunction("trim") { inputPath: String, outputPath: String, startMs: Double, endMs: Double, promise: Promise ->
      try {
        promise.resolve(AudioTrimProcessor.trim(inputPath, outputPath, startMs, endMs))
      } catch (error: Exception) {
        promise.reject("AUDIO_TRIM_FAILED", error.message ?: "Unable to trim audio", error)
      }
    }
  }

  private fun probeAudio(inputPath: String): Map<String, Any?> {
    val extractor = MediaExtractor()
    try {
      extractor.setDataSource(inputPath)
      var audioTrack = -1
      var durationUs = 0L
      var sampleRate = 0
      var channels = 0
      var mimeType: String? = null

      for (index in 0 until extractor.trackCount) {
        val format = extractor.getTrackFormat(index)
        val mime = format.getString(MediaFormat.KEY_MIME) ?: continue
        if (mime.startsWith("audio/")) {
          audioTrack = index
          mimeType = mime
          if (format.containsKey(MediaFormat.KEY_DURATION)) durationUs = format.getLong(MediaFormat.KEY_DURATION)
          if (format.containsKey(MediaFormat.KEY_SAMPLE_RATE)) sampleRate = format.getInteger(MediaFormat.KEY_SAMPLE_RATE)
          if (format.containsKey(MediaFormat.KEY_CHANNEL_COUNT)) channels = format.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
          break
        }
      }
      require(audioTrack >= 0) { "No supported audio track was found." }
      return mapOf(
        "durationMs" to durationUs / 1000.0,
        "sampleRate" to sampleRate,
        "channels" to channels,
        "mimeType" to mimeType,
      )
    } finally {
      extractor.release()
    }
  }
}
