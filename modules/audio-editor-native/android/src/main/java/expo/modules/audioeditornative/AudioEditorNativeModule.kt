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
        promise.resolve(AudioTrimProcessor.trim(appContext.reactContext, inputPath, outputPath, startMs, endMs))
      } catch (error: Exception) {
        promise.reject("AUDIO_TRIM_FAILED", error.message ?: "Unable to trim audio", error)
      }
    }

    AsyncFunction("decode") { inputPath: String, promise: Promise ->
      try {
        val context = requireNotNull(appContext.reactContext) { "Audio editor context is unavailable." }
        val decoded = AndroidAudioDecoder(context).decode(inputPath)
        promise.resolve(mapOf(
          "sampleRate" to decoded.sampleRate,
          "channels" to decoded.channels,
          "frameCount" to decoded.frameCount,
          "durationMs" to decoded.durationMs,
          "samples" to decoded.samples.toList(),
        ))
      } catch (error: Exception) {
        promise.reject("AUDIO_DECODE_FAILED", error.message ?: "Unable to decode audio", error)
      }
    }

    AsyncFunction("mix") { input: Map<String, Any?>, promise: Promise ->
      try {
        val context = requireNotNull(appContext.reactContext) { "Audio editor context is unavailable." }
        val basePath = input["inputPath"] as? String ?: error("Base audio path is required.")
        val overlayPath = input["overlayPath"] as? String ?: error("Overlay audio path is required.")
        val outputPath = input["outputPath"] as? String ?: error("Output audio path is required.")
        val startMs = (input["overlayStartMs"] as? Number)?.toDouble() ?: 0.0
        val volume = (input["overlayVolume"] as? Number)?.toDouble() ?: 1.0
        promise.resolve(AudioMixProcessor.mix(
          context,
          basePath,
          AudioMixProcessor.Clip(overlayPath, startMs, volume),
          outputPath,
        ))
      } catch (error: Exception) {
        promise.reject("AUDIO_MIX_FAILED", error.message ?: "Unable to mix audio", error)
      }
    }

    AsyncFunction("mixProject") { input: Map<String, Any?>, promise: Promise ->
      try {
        val context = requireNotNull(appContext.reactContext) { "Audio editor context is unavailable." }
        val basePath = input["basePath"] as? String ?: error("Base audio path is required.")
        val outputPath = input["outputPath"] as? String ?: error("Output audio path is required.")
        val rawOverlays = input["overlays"] as? List<*> ?: emptyList<Any?>()
        val overlays = rawOverlays.mapIndexed { index, raw ->
          val clip = raw as? Map<*, *> ?: error("Audio track ${index + 1} is invalid.")
          val path = clip["path"] as? String ?: error("Audio track ${index + 1} path is required.")
          val startMs = (clip["startMs"] as? Number)?.toDouble() ?: 0.0
          val volume = (clip["volume"] as? Number)?.toDouble() ?: 1.0
          AudioMixProcessor.Clip(path, startMs, volume)
        }
        promise.resolve(AudioMixProcessor.mixProject(context, basePath, overlays, outputPath))
      } catch (error: Exception) {
        promise.reject("AUDIO_MIX_PROJECT_FAILED", error.message ?: "Unable to mix audio project", error)
      }
    }

    AsyncFunction("compress") { inputPath: String, outputPath: String, bitrate: Int, sampleRate: Int, promise: Promise ->
      try {
        promise.resolve(AudioCompressorProcessor.compress(appContext.reactContext, inputPath, outputPath, bitrate, sampleRate))
      } catch (error: Exception) {
        promise.reject("AUDIO_COMPRESS_FAILED", error.message ?: "Unable to compress audio", error)
      }
    }
  }

  private fun probeAudio(inputPath: String): Map<String, Any?> {
    val extractor = MediaExtractor()
    try {
      when {
        inputPath.startsWith("content://") || inputPath.startsWith("file://") -> {
          val uri = android.net.Uri.parse(inputPath)
          appContext.reactContext?.contentResolver?.openFileDescriptor(uri, "r").use { descriptor ->
            requireNotNull(descriptor) { "Unable to open selected audio file." }
            extractor.setDataSource(descriptor.fileDescriptor)
          }
        }
        else -> extractor.setDataSource(inputPath)
      }
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
