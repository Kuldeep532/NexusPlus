package expo.modules.audioeditornative.shared

data class PcmAudioBuffer(
  val sampleRate: Int,
  val channels: Int,
  val samples: FloatArray,
) {
  init {
    require(sampleRate > 0) { "Sample rate must be positive." }
    require(channels > 0) { "Channel count must be positive." }
    require(samples.size % channels == 0) { "PCM sample buffer is not frame-aligned." }
  }

  val frameCount: Int
    get() = samples.size / channels

  val durationMs: Double
    get() = frameCount * 1000.0 / sampleRate
}

data class AudioTimelineClip(
  val audio: PcmAudioBuffer,
  val startMs: Double,
  val volume: Float = 1.0f,
) {
  init {
    require(startMs >= 0.0 && startMs.isFinite()) { "Clip start time must be finite and non-negative." }
    require(volume.isFinite() && volume >= 0.0f && volume <= 2.0f) { "Clip volume must be between 0 and 2." }
  }
}
