package expo.modules.audioeditornative

import android.media.MediaExtractor
import android.media.MediaFormat
import android.content.Intent
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AudioEditorNativeModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AudioEditorNative")

    AsyncFunction("probe") { inputPath: String, promise: Promise ->
      try { promise.resolve(probeAudio(inputPath)) }
      catch (error: Exception) { promise.reject("AUDIO_PROBE_FAILED", error.message ?: "Unable to inspect audio", error) }
    }

    AsyncFunction("trim") { inputPath: String, outputPath: String, startMs: Double, endMs: Double, promise: Promise ->
      try { promise.resolve(AudioTrimProcessor.trim(appContext.reactContext, inputPath, outputPath, startMs, endMs)) }
      catch (error: Exception) { promise.reject("AUDIO_TRIM_FAILED", error.message ?: "Unable to trim audio", error) }
    }

    AsyncFunction("vocalRemove") { inputPath: String, outputPath: String, outputStem: String, quality: String, preserveBass: Boolean, preserveStereo: Boolean, promise: Promise ->
      try {
        val context = requireNotNull(appContext.reactContext) { "Audio editor context is unavailable." }
        val result = VocalRemovalProcessor.process(context, inputPath, outputPath, outputStem, quality, preserveBass, preserveStereo)
        promise.resolve(mapOf(
          "outputPath" to result.outputPath,
          "durationMs" to result.durationMs,
          "sampleRate" to result.sampleRate,
          "channels" to result.channels,
          "mimeType" to result.mimeType,
        ))
      } catch (error: Exception) {
        promise.reject("AUDIO_VOCAL_REMOVE_FAILED", error.message ?: "Unable to remove vocals", error)
      }
    }

    AsyncFunction("decode") { inputPath: String, promise: Promise ->
      try {
        val context = requireNotNull(appContext.reactContext) { "Audio editor context is unavailable." }
        val decoded = AndroidAudioDecoder(context).decode(inputPath)
        promise.resolve(mapOf("sampleRate" to decoded.sampleRate, "channels" to decoded.channels, "frameCount" to decoded.frameCount, "durationMs" to decoded.durationMs, "samples" to decoded.samples.toList()))
      } catch (error: Exception) { promise.reject("AUDIO_DECODE_FAILED", error.message ?: "Unable to decode audio", error) }
    }

    AsyncFunction("mix") { input: Map<String, Any?>, promise: Promise ->
      try {
        val context = requireNotNull(appContext.reactContext) { "Audio editor context is unavailable." }
        val basePath = input["inputPath"] as? String ?: error("Base audio path is required.")
        val overlayPath = input["overlayPath"] as? String ?: error("Overlay audio path is required.")
        val outputPath = input["outputPath"] as? String ?: error("Output audio path is required.")
        val startMs = (input["overlayStartMs"] as? Number)?.toDouble() ?: 0.0
        val volume = (input["overlayVolume"] as? Number)?.toDouble() ?: 1.0
        promise.resolve(AudioMixProcessor.mix(context, basePath, AudioMixProcessor.Clip(overlayPath, startMs, volume), outputPath))
      } catch (error: Exception) { promise.reject("AUDIO_MIX_FAILED", error.message ?: "Unable to mix audio", error) }
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
      } catch (error: Exception) { promise.reject("AUDIO_MIX_PROJECT_FAILED", error.message ?: "Unable to mix audio project", error) }
    }

    AsyncFunction("applyEffect") { input: Map<String, Any?>, promise: Promise ->
      try {
        val inputPath = input["inputPath"] as? String ?: error("Input audio path is required.")
        val outputPath = input["outputPath"] as? String ?: error("Output audio path is required.")
        val effect = input["effect"] as? String ?: error("Audio effect is required.")
        val startMs = (input["startMs"] as? Number)?.toDouble() ?: 0.0
        val endMs = (input["endMs"] as? Number)?.toDouble() ?: Double.MAX_VALUE
        val amount = (input["amount"] as? Number)?.toDouble() ?: 0.95
        promise.resolve(
          AudioEffectProcessor.apply(
            appContext.reactContext,
            inputPath,
            outputPath,
            effect,
            startMs,
            endMs,
            amount,
          )
        )
      } catch (error: Exception) {
        promise.reject("AUDIO_EFFECT_FAILED", error.message ?: "Unable to apply audio effect", error)
      }
    }

    AsyncFunction("removeSilence") { inputPath: String, outputPath: String, settings: Map<String, Any?>, promise: Promise ->
      try {
        val context = requireNotNull(appContext.reactContext) { "Audio editor context is unavailable." }
        val thresholdDb = (settings["thresholdDb"] as? Number)?.toDouble() ?: -40.0
        val minSilenceMs = (settings["minSilenceMs"] as? Number)?.toDouble() ?: 350.0
        val paddingMs = (settings["paddingMs"] as? Number)?.toDouble() ?: 80.0
        val result = RemoveSilenceProcessor.process(context, inputPath, outputPath, thresholdDb, minSilenceMs, paddingMs)
        promise.resolve(mapOf(
          "outputPath" to result.outputPath,
          "durationMs" to result.durationMs,
          "sampleRate" to result.sampleRate,
          "channels" to result.channels,
          "mimeType" to result.mimeType,
          "removedSilenceMs" to result.removedSilenceMs,
        ))
      } catch (error: Exception) {
        promise.reject("AUDIO_REMOVE_SILENCE_FAILED", error.message ?: "Unable to remove silence", error)
      }
    }

    AsyncFunction("compress") { input: Map<String, Any?>, promise: Promise ->
      try {
        val context = requireNotNull(appContext.reactContext) { "Audio editor context is unavailable." }
        val inputPath = input["inputPath"] as? String ?: error("Input audio path is required.")
        val outputPath = input["outputPath"] as? String ?: error("Output audio path is required.")
        val bitrateKbps = (input["bitrateKbps"] as? Number)?.toInt() ?: error("Target bitrate is required.")
        val sampleRateHz = (input["sampleRateHz"] as? Number)?.toInt() ?: error("Target sample rate is required.")
        promise.resolve(AudioCompressionProcessor.compress(context, inputPath, outputPath, bitrateKbps, sampleRateHz))
      } catch (error: Exception) {
        promise.reject("AUDIO_COMPRESS_FAILED", error.message ?: "Unable to compress audio", error)
      }
    }

    AsyncFunction("speedAndPitch") { inputPath: String, outputPath: String, speed: Double, pitchSemitones: Double, promise: Promise ->
      try {
        val context = requireNotNull(appContext.reactContext) { "Audio editor context is unavailable." }
        val result = SpeedPitchProcessor.process(context, inputPath, outputPath, speed, pitchSemitones)
        promise.resolve(mapOf(
          "outputPath" to result.outputPath,
          "durationMs" to result.durationMs,
          "sampleRate" to result.sampleRate,
          "channels" to result.channels,
          "mimeType" to result.mimeType,
        ))
      } catch (error: Exception) {
        promise.reject("AUDIO_SPEED_PITCH_FAILED", error.message ?: "Unable to change audio speed and pitch", error)
      }
    }

    AsyncFunction("pickMediaFolder") { kind: String, promise: Promise ->
      try {
        val activity = appContext.currentActivity ?: error("An Android activity is required.")
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT_TREE).apply {
          addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
          addFlags(Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION)
        }
        activity.startActivityForResult(intent, if (kind == "video") 4908 else 4907)
        promise.resolve(true)
      } catch (error: Exception) {
        promise.reject("MEDIA_FOLDER_PICK_FAILED", error.message ?: "Unable to open media folder picker.", error)
      }
    }

    AsyncFunction("isOpenCvAvailable") { promise: Promise ->
      try {
        val available = runCatching { Class.forName("org.opencv.android.OpenCVLoader") }.isSuccess
        promise.resolve(available)
      } catch (error: Exception) { promise.resolve(false) }
    }

    AsyncFunction("describeVideoFrame") { videoUri: String, timestampMs: Double, language: String, promise: Promise ->
      try {
        promise.resolve(VideoDescriptionProcessor.describeFrame(appContext.reactContext, videoUri, timestampMs, language))
      } catch (error: Exception) {
        promise.reject("VIDEO_DESCRIPTION_FAILED", error.message ?: "Unable to describe video frame", error)
      }
    }

    AsyncFunction("synthesizePiper") { input: Map<String, Any?>, promise: Promise ->
      try {
        val context = requireNotNull(appContext.reactContext) { "Audio editor context is unavailable." }
        val text = input["text"] as? String ?: error("Text is required.")
        val modelPath = input["modelPath"] as? String ?: error("ONNX voice model path is required.")
        val configPath = input["configPath"] as? String ?: error("Voice configuration path is required.")
        val lengthScale = (input["lengthScale"] as? Number)?.toDouble() ?: 1.0
        val pitchScale = (input["pitchScale"] as? Number)?.toDouble() ?: 1.0
        val emotion = input["emotion"] as? String ?: "neutral"
        val clone = input["clone"] as? Boolean ?: false
        val outputPath = java.io.File(context.cacheDir, "nexus-tts-${System.currentTimeMillis()}.wav").absolutePath
        promise.resolve(mapOf("outputPath" to PiperTtsProcessor.synthesize(context, text, modelPath, configPath, outputPath, lengthScale, pitchScale, emotion, clone)))
      } catch (error: Exception) { promise.reject("PIPER_SYNTHESIS_FAILED", error.message ?: "Unable to synthesize speech", error) }
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
      return mapOf("durationMs" to durationUs / 1000.0, "sampleRate" to sampleRate, "channels" to channels, "mimeType" to mimeType)
    } finally { extractor.release() }
  }
}
