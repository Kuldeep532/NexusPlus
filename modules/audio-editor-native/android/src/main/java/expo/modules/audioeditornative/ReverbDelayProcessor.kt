package expo.modules.audioeditornative

import android.content.Context
import java.io.File
import kotlin.math.PI
import kotlin.math.exp

internal object ReverbDelayProcessor {
  data class Preset(val delayMs: Double, val feedback: Double, val wet: Double, val earlyMs: Double, val decayMs: Double)

  fun process(context: Context?, inputPath: String, outputPath: String, preset: String, amount: Double, delayMs: Double, feedback: Double): AudioEffectProcessor.Result {
    require(context != null) { "Audio editor context is unavailable." }
    require(amount.isFinite() && amount in 0.0..1.0) { "Reverb amount must be between 0 and 1." }
    require(feedback.isFinite() && feedback in 0.0..0.95) { "Delay feedback must be between 0 and 0.95." }
    require(delayMs.isFinite() && delayMs in 1.0..2000.0) { "Delay must be between 1 ms and 2000 ms." }
    val source = decodePcm(context, inputPath)
    val presetData = presetFor(preset)
    val effectiveDelayMs = if (preset == "custom-delay") delayMs else presetData.delayMs
    val effectiveFeedback = if (preset == "custom-delay") feedback else presetData.feedback
    val effectiveWet = (presetData.wet * amount).coerceIn(0.0, 1.0)
    val processed = apply(source.samples, source.sampleRate, source.channels, presetData, effectiveDelayMs, effectiveFeedback, effectiveWet, amount)
    val outPath = AudioEffectProcessor.encodeAacForInternal(processed, source.sampleRate, source.channels, outputPath)
    return AudioEffectProcessor.Result(outPath, processed.size.toDouble() / source.channels / source.sampleRate * 1000.0, source.sampleRate, source.channels, "audio/mp4")
  }

  private data class Decoded(val sampleRate: Int, val channels: Int, val samples: FloatArray)

  private fun presetFor(name: String): Preset = when (name) {
    "small-room" -> Preset(28.0, 0.24, 0.38, 9.0, 260.0)
    "hall" -> Preset(55.0, 0.42, 0.55, 18.0, 900.0)
    "cave" -> Preset(110.0, 0.60, 0.68, 35.0, 1500.0)
    "canyon" -> Preset(180.0, 0.72, 0.74, 55.0, 2200.0)
    "custom-delay" -> Preset(140.0, 0.45, 0.58, 0.0, 1000.0)
    else -> error("Unknown reverb/delay preset.")
  }

  private fun apply(input: FloatArray, rate: Int, channels: Int, preset: Preset, delayMs: Double, feedback: Double, wet: Double, amount: Double): FloatArray {
    val frames = input.size / channels
    val delayFrames = (rate * delayMs / 1000.0).roundToInt().coerceAtLeast(1)
    val earlyFrames = (rate * preset.earlyMs / 1000.0).roundToInt().coerceAtLeast(0)
    val tailFrames = (rate * preset.decayMs / 1000.0).roundToInt()
    val total = frames + maxOf(delayFrames * 2, tailFrames)
    val out = FloatArray(total * channels)
    val delayGain = (0.30 + feedback * 0.55).coerceAtMost(0.88).toFloat()
    val roomDamp = exp(-3.0 / maxOf(1.0, preset.decayMs)).toFloat()

    for (f in 0 until total) {
      for (c in 0 until channels) {
        val idx = f * channels + c
        var dry = if (f < frames) input[idx] else 0f
        var effect = 0f
        if (f >= earlyFrames && earlyFrames > 0) effect += out[(f - earlyFrames) * channels + c] * (0.16f + amount.toFloat() * 0.12f)
        if (f >= delayFrames) effect += out[(f - delayFrames) * channels + c] * delayGain
        if (f >= delayFrames * 2) effect += out[(f - delayFrames * 2) * channels + c] * (delayGain * 0.46f)
        effect *= (1.0f - roomDamp * 0.18f)
        if (f > frames) dry = 0f
        out[idx] = (dry * (1f - wet.toFloat()) + (dry + effect) * wet.toFloat()).coerceIn(-1f, 1f)
      }
    }
    return out
  }

  private fun decodePcm(context: Context, inputPath: String): Decoded {
    val decoded = AndroidAudioDecoder(context).decode(inputPath)
    return Decoded(decoded.sampleRate, decoded.channels, decoded.samples)
  }

  private fun Double.roundToInt(): Int = kotlin.math.round(this).toInt()
}
