package expo.modules.audioeditornative

internal object AudioPcmMixer {
  fun mix(base: PcmAudio, effect: PcmAudio, startMs: Double, volume: Double): PcmAudio {
    require(startMs.isFinite() && startMs >= 0.0) { "Effect start time must be valid." }
    require(volume.isFinite() && volume >= 0.0 && volume <= 2.0) { "Effect volume must be between 0 and 2." }
    require(base.channels == effect.channels) { "Base and effect channel counts must match." }
    require(base.sampleRate == effect.sampleRate) { "Base and effect sample rates must match." }

    val startFrame = (startMs * base.sampleRate / 1000.0).toLong().coerceAtLeast(0L)
    val offset = (startFrame * base.channels).coerceAtMost(Int.MAX_VALUE.toLong()).toInt()
    val mixed = base.samples.copyOf()
    val gain = volume.toFloat()
    val available = mixed.size - offset
    val frames = minOf(effect.frameCount, if (available > 0) available / base.channels else 0)

    for (frame in 0 until frames) {
      val baseIndex = offset + frame * base.channels
      val effectIndex = frame * effect.channels
      for (channel in 0 until base.channels) {
        val value = mixed[baseIndex + channel] + effect.samples[effectIndex + channel] * gain
        mixed[baseIndex + channel] = value.coerceIn(-1f, 1f)
      }
    }

    return PcmAudio(base.sampleRate, base.channels, mixed)
  }
}
