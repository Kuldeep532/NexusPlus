package expo.modules.audioeditornative

import android.content.Context
import android.media.MediaExtractor
import android.media.MediaFormat
import android.os.Handler
import android.os.Looper
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise

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
      promise.reject(
        "AUDIO_TRIM_NOT_READY",
        "The native trim/export stage is not enabled until the verified Media3 export pipeline is linked.",
        null
      )
    }
  }

  private fun probeAudio(inputPath: String): Map<String, Any?> {
    val extractor = MediaExtractor()
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
    extractor.release()

    if (audioTrack < 0) {
      throw IllegalArgumentException("No supported audio track was found.")
    }

    return mapOf(
      "durationMs" to durationUs / 1000.0,
      "sampleRate" to sampleRate,
      "channels" to channels,
      "mimeType" to mimeType,
    )
  }
}
