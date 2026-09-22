package expo.modules.audioeditornative

import android.content.Context
import java.io.File
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

internal object AudioEffectProcessor {
  private enum class Type { VOLUME, FADE_IN, FADE_OUT, NORMALIZE, LOFI, ECHO, STEREO_SPLIT }

  fun apply(
    context: Context?,
    inputPath: String,
    outputPath: String,
    effect: String,
    startMs: Double,
    endMs: Double,
    amount: Double,
  ): Map<String, Any?> {
    requireNotNull(context) { "Audio editor context is unavailable." }
    require(inputPath.isNotBlank()) { "Input audio path is required." }
    require(outputPath.isNotBlank()) { "Output audio path is required." }

    val type = when (effect.lowercase()) {
      "volume" -> Type.VOLUME
      "fade-in" -> Type.FADE_IN
      "fade-out" -> Type.FADE_OUT
      "normalize" -> Type.NORMALIZE
      "lofi" -> Type.LOFI
      "echo" -> Type.ECHO
      "stereo-split" -> Type.STEREO_SPLIT
      else -> throw IllegalArgumentException("Unsupported audio effect: $effect")
    }

    val decoded = AndroidAudioDecoder(context).decode(inputPath)
    val audio = PcmAudio(decoded.sampleRate, decoded.channels, decoded.samples.copyOf())
    require(audio.frameCount > 0) { "Audio contains no samples." }

    val safeStartMs = startMs.takeIf { it.isFinite() }?.coerceAtLeast(0.0) ?: 0.0
    val safeEndMs = if (endMs.isFinite() && endMs > safeStartMs) {
      min(endMs, audio.durationMs)
    } else {
      audio.durationMs
    }
    require(safeEndMs > safeStartMs) { "Effect range is invalid." }

    val startFrame = (safeStartMs * audio.sampleRate / 1000.0)
      .roundToInt()
      .coerceIn(0, audio.frameCount - 1)
    val endFrame = (safeEndMs * audio.sampleRate / 1000.0)
      .roundToInt()
      .coerceIn(startFrame + 1, audio.frameCount)

    when (type) {
      Type.VOLUME -> {
        require(amount.isFinite() && amount >= 0.0 && amount <= 2.0) {
          "Volume amount must be between 0 and 2."
        }
        transformFrames(audio, startFrame, endFrame) { _, value -> value * amount.toFloat() }
      }

      Type.FADE_IN -> {
        transformFrames(audio, startFrame, endFrame) { frame, value ->
          val progress = ((frame - startFrame).toDouble() /
            max(1, endFrame - startFrame - 1)).coerceIn(0.0, 1.0)
          value * progress.toFloat()
        }
      }

      Type.FADE_OUT -> {
        transformFrames(audio, startFrame, endFrame) { frame, value ->
          val progress = ((frame - startFrame).toDouble() /
            max(1, endFrame - startFrame - 1)).coerceIn(0.0, 1.0)
          value * (1.0 - progress).toFloat()
        }
      }

      Type.NORMALIZE -> {
        val peak = findPeak(audio, startFrame, endFrame)
        require(peak > 0f) { "Cannot normalize silent audio." }
        val target = if (amount.isFinite() && amount > 0.0) amount.coerceIn(0.1, 1.0) else 0.95
        val gain = target.toFloat() / peak
        transformFrames(audio, startFrame, endFrame) { _, value -> value * gain }
      }

      Type.LOFI -> applyLowPass(audio, startFrame, endFrame, amount)
      Type.ECHO -> applyEcho(audio, startFrame, endFrame, amount)
      Type.STEREO_SPLIT -> {
        require(audio.channels >= 2) { "Stereo Split requires stereo audio." }
        applyStereoSplit(audio, startFrame, endFrame, amount)
      }
    }

    val output = PcmWavWriter.write(outputPath, audio)
    require(File(outputPath).isFile && File(outputPath).length() > 44L) {
      "Audio effect export did not produce a valid file."
    }
    return output
  }

  private fun applyLowPass(audio: PcmAudio, startFrame: Int, endFrame: Int, amount: Double) {
    val strength = if (amount.isFinite()) amount.coerceIn(0.1, 1.0) else 0.65
    val alpha = (0.08 + (1.0 - strength) * 0.55).toFloat().coerceIn(0.05f, 0.75f)
    val previous = FloatArray(audio.channels)
    var initialized = false
    for (frame in startFrame until endFrame) {
      val base = frame * audio.channels
      for (channel in 0 until audio.channels) {
        val sample = audio.samples[base + channel]
        if (!initialized) previous[channel] = sample
        previous[channel] += alpha * (sample - previous[channel])
        audio.samples[base + channel] = previous[channel]
      }
      initialized = true
    }
  }

  private fun applyEcho(audio: PcmAudio, startFrame: Int, endFrame: Int, amount: Double) {
    val strength = if (amount.isFinite()) amount.coerceIn(0.1, 1.0) else 0.35
    val delayFrames = (audio.sampleRate * 0.18).roundToInt().coerceAtLeast(1)
    val feedback = (strength * 0.55).toFloat()
    val snapshot = audio.samples.copyOf()
    for (frame in startFrame until endFrame) {
      val delayed = frame - delayFrames
      if (delayed < 0) continue
      val base = frame * audio.channels
      val delayedBase = delayed * audio.channels
      for (channel in 0 until audio.channels) {
        audio.samples[base + channel] =
          (audio.samples[base + channel] + snapshot[delayedBase + channel] * feedback).coerceIn(-1f, 1f)
      }
    }
  }

  private fun applyStereoSplit(audio: PcmAudio, startFrame: Int, endFrame: Int, amount: Double) {
    val separation = if (amount.isFinite()) amount.coerceIn(0.0, 1.0).toFloat() else 1.0f
    for (frame in startFrame until endFrame) {
      val base = frame * audio.channels
      val left = audio.samples[base]
      val right = audio.samples[base + 1]
      val mid = (left + right) * 0.5f
      val side = (left - right) * 0.5f * (0.35f + separation * 1.25f)
      audio.samples[base] = (mid + side).coerceIn(-1f, 1f)
      audio.samples[base + 1] = (mid - side).coerceIn(-1f, 1f)
    }
  }

  private fun findPeak(audio: PcmAudio, startFrame: Int, endFrame: Int): Float {
    var peak = 0f
    val start = startFrame * audio.channels
    val end = endFrame * audio.channels
    for (i in start until end) {
      peak = max(peak, abs(audio.samples[i]))
    }
    return peak
  }

  private inline fun transformFrames(
    audio: PcmAudio,
    startFrame: Int,
    endFrame: Int,
    transform: (frame: Int, value: Float) -> Float,
  ) {
    val start = startFrame * audio.channels
    val end = endFrame * audio.channels
    for (i in start until end) {
      val frame = i / audio.channels
      audio.samples[i] = transform(frame, audio.samples[i]).coerceIn(-1f, 1f)
    }
  }
}
