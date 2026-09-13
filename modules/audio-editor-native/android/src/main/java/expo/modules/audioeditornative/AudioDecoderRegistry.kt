package expo.modules.audioeditornative

import expo.modules.audioeditornative.shared.AudioDecoderBackend

internal class AudioDecoderRegistry(
  private val backends: List<AudioDecoderBackend>,
) {
  fun select(mimeType: String?): AudioDecoderBackend {
    return backends.firstOrNull { it.supports(mimeType) }
      ?: throw IllegalArgumentException("No audio decoder backend supports $mimeType")
  }
}
