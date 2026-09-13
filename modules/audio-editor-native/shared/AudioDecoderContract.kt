package expo.modules.audioeditornative.shared

/**
 * Common decoded-audio representation shared by every audio editing operation.
 * Implementations may use platform codecs or another verified decoder backend.
 */
data class DecodedAudio(
  val sampleRate: Int,
  val channels: Int,
  val samples: FloatArray,
) {
  init {
    require(sampleRate > 0) { "Sample rate must be positive." }
    require(channels > 0) { "Channel count must be positive." }
    require(samples.size % channels == 0) { "PCM samples must be frame-aligned." }
  }

  val frameCount: Int
    get() = samples.size / channels

  val durationMs: Double
    get() = frameCount * 1000.0 / sampleRate
}

interface AudioDecoderBackend {
  fun supports(mimeType: String?): Boolean
  fun decode(inputPath: String): DecodedAudio
}
