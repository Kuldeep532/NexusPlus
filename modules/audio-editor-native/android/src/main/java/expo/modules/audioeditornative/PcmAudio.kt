package expo.modules.audioeditornative

internal data class PcmAudio(
  val sampleRate: Int,
  val channels: Int,
  val samples: FloatArray,
) {
  init {
    require(sampleRate > 0) { "Sample rate must be positive." }
    require(channels > 0) { "Channel count must be positive." }
    require(samples.size % channels == 0) { "PCM sample buffer must be channel-aligned." }
  }

  val frameCount: Int
    get() = samples.size / channels

  val durationMs: Double
    get() = frameCount * 1000.0 / sampleRate
}
