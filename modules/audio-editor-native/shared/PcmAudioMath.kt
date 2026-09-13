package expo.modules.audioeditornative.shared

internal object PcmAudioMath {
  fun clampSample(value: Float): Float = value.coerceIn(-1f, 1f)

  fun mixInto(destination: FloatArray, source: FloatArray, destinationOffsetFrames: Int, sourceGain: Float) {
    require(destinationOffsetFrames >= 0) { "Destination offset must be non-negative." }
    require(sourceGain.isFinite() && sourceGain >= 0f) { "Source gain must be finite and non-negative." }
    require(destinationOffsetFrames + source.size / 1 >= 0) { "Invalid PCM range." }
    val count = minOf(source.size, destination.size - destinationOffsetFrames)
    if (count <= 0) return
    for (index in 0 until count) {
      val mixed = destination[destinationOffsetFrames + index] + source[index] * sourceGain
      destination[destinationOffsetFrames + index] = clampSample(mixed)
    }
  }
}
