package expo.modules.audioeditornative.shared

object PcmAudioMixer {
  fun mix(
    base: PcmAudioBuffer,
    clips: List<AudioTimelineClip>,
  ): PcmAudioBuffer {
    if (clips.isEmpty()) return base

    var maxEndFrame = base.frameCount
    for (clip in clips) {
      require(clip.audio.channels == base.channels) { "All PCM tracks must use the same channel count." }
      require(clip.audio.sampleRate == base.sampleRate) { "All PCM tracks must use the same sample rate." }
      val startFrame = msToFrame(clip.startMs, base.sampleRate)
      maxEndFrame = maxOf(maxEndFrame, startFrame + clip.audio.frameCount)
    }

    val output = base.samples.copyOf(maxEndFrame * base.channels)
    clips.forEach { clip ->
      val startFrame = msToFrame(clip.startMs, base.sampleRate)
      for (frame in 0 until clip.audio.frameCount) {
        val outOffset = (startFrame + frame) * base.channels
        val inOffset = frame * base.channels
        for (channel in 0 until base.channels) {
          output[outOffset + channel] = clampSample(
            output[outOffset + channel] + clip.audio.samples[inOffset + channel] * clip.volume,
          )
        }
      }
    }
    return PcmAudioBuffer(base.sampleRate, base.channels, output)
  }

  private fun msToFrame(ms: Double, sampleRate: Int): Int =
    (ms * sampleRate / 1000.0).toLong().coerceAtLeast(0L).coerceAtMost(Int.MAX_VALUE.toLong()).toInt()

  private fun clampSample(value: Float): Float = value.coerceIn(-1.0f, 1.0f)
}
