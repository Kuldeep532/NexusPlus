package expo.modules.audioeditornative

import expo.modules.kotlin.Promise

internal fun registerAudioCompressorFunction(
  definition: expo.modules.kotlin.modules.ModuleDefinitionBuilder,
  promise: Promise,
  inputPath: String,
  outputPath: String,
  bitrate: Int,
  sampleRate: Int,
  context: android.content.Context?,
) {
  try {
    promise.resolve(AudioCompressorProcessor.compress(context, inputPath, outputPath, bitrate, sampleRate))
  } catch (error: Exception) {
    promise.reject("AUDIO_COMPRESS_FAILED", error.message ?: "Unable to compress audio", error)
  }
}
