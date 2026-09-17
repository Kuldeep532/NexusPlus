package expo.modules.audioeditornative

import android.content.Context
import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMuxer
import android.net.Uri
import java.io.File
import kotlin.math.PI
import kotlin.math.exp
import kotlin.math.sin
import kotlin.math.tanh

internal object AudioEffectProcessor {
  data class Result(val outputPath: String, val durationMs: Double, val sampleRate: Int, val channels: Int, val mimeType: String)
  private data class Decoded(val sampleRate: Int, val channels: Int, val samples: FloatArray)

  fun process(context: Context, inputPath: String, outputPath: String, effect: String, amount: Double): Result {
    require(effect in setOf("bass-boost", "treble", "vibrato", "echo", "telephone", "robot", "reverb", "megaphone")) { "Unknown audio effect." }
    require(amount.isFinite() && amount in 0.0..1.0) { "Effect amount must be between 0 and 1." }
    val decoded = decodePcm(context, inputPath)
    val processed = when (effect) {
      "bass-boost" -> bassBoost(decoded.samples, decoded.sampleRate, decoded.channels, amount)
      "treble" -> treble(decoded.samples, decoded.sampleRate, decoded.channels, amount)
      "vibrato" -> vibrato(decoded.samples, decoded.sampleRate, decoded.channels, amount)
      "echo" -> echo(decoded.samples, decoded.sampleRate, decoded.channels, amount)
      "telephone" -> telephone(decoded.samples, decoded.sampleRate, decoded.channels, amount)
      "robot" -> robot(decoded.samples, decoded.sampleRate, decoded.channels, amount)
      "reverb" -> reverb(decoded.samples, decoded.sampleRate, decoded.channels, amount)
      else -> megaphone(decoded.samples, decoded.sampleRate, decoded.channels, amount)
    }
    val out = encodeAac(processed, decoded.sampleRate, decoded.channels, outputPath)
    return Result(out, processed.size.toDouble() / decoded.channels / decoded.sampleRate * 1000.0, decoded.sampleRate, decoded.channels, "audio/mp4")
  }

  fun processReverbDelay(context: Context, inputPath: String, outputPath: String, preset: String, amount: Double, delayMs: Double, feedback: Double): Result {
    require(preset in setOf("small-room", "hall", "cave", "canyon")) { "Unknown reverb preset." }
    require(amount.isFinite() && amount in 0.0..1.0) { "Reverb amount must be between 0 and 1." }
    require(delayMs.isFinite() && delayMs in 1.0..1200.0) { "Delay must be between 1 ms and 1200 ms." }
    require(feedback.isFinite() && feedback in 0.0..0.9) { "Feedback must be between 0 and 0.9." }
    val decoded = decodePcm(context, inputPath)
    val processed = reverbDelay(decoded.samples, decoded.sampleRate, decoded.channels, preset, amount, delayMs, feedback)
    val out = encodeAac(processed, decoded.sampleRate, decoded.channels, outputPath)
    return Result(out, processed.size.toDouble() / decoded.channels / decoded.sampleRate * 1000.0, decoded.sampleRate, decoded.channels, "audio/mp4")
  }

  private fun decodePcm(context: Context, inputPath: String): Decoded {
    val extractor = MediaExtractor()
    when {
      inputPath.startsWith("content://") || inputPath.startsWith("file://") -> {
        val descriptor = context.contentResolver.openFileDescriptor(Uri.parse(inputPath), "r")
        requireNotNull(descriptor) { "Unable to open audio file." }
        descriptor.use { extractor.setDataSource(it.fileDescriptor) }
      }
      File(inputPath).isFile -> extractor.setDataSource(inputPath)
      else -> error("Input audio file was not found.")
    }
    try {
      var track = -1; var format: MediaFormat? = null
      for (i in 0 until extractor.trackCount) {
        val f = extractor.getTrackFormat(i); val mime = f.getString(MediaFormat.KEY_MIME) ?: continue
        if (mime.startsWith("audio/")) { track = i; format = f; break }
      }
      require(track >= 0 && format != null) { "No supported audio track was found." }
      val inputFormat = format!!
      val rate = inputFormat.getInteger(MediaFormat.KEY_SAMPLE_RATE)
      val channels = inputFormat.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
      val mime = inputFormat.getString(MediaFormat.KEY_MIME) ?: error("Audio codec MIME type is missing.")
      extractor.selectTrack(track)
      val decoder = MediaCodec.createDecoderByType(mime)
      decoder.configure(inputFormat, null, null, 0)
      decoder.start()
      val info = MediaCodec.BufferInfo(); val samples = ArrayList<Float>(); var inputDone = false; var outputDone = false
      try {
        while (!outputDone) {
          if (!inputDone) {
            val idx = decoder.dequeueInputBuffer(10_000)
            if (idx >= 0) {
              val buffer = decoder.getInputBuffer(idx) ?: error("Decoder input unavailable.")
              buffer.clear()
              val size = extractor.readSampleData(buffer, 0)
              if (size < 0) { decoder.queueInputBuffer(idx, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM); inputDone = true }
              else { decoder.queueInputBuffer(idx, 0, size, extractor.sampleTime.coerceAtLeast(0), extractor.sampleFlags); extractor.advance() }
            }
          }
          when (val oi = decoder.dequeueOutputBuffer(info, 10_000)) {
            MediaCodec.INFO_TRY_AGAIN_LATER, MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> Unit
            else -> if (oi >= 0) {
              val buffer = decoder.getOutputBuffer(oi) ?: error("Decoder output unavailable.")
              if (info.size > 0) { buffer.position(info.offset); buffer.limit(info.offset + info.size); while (buffer.remaining() >= 2) samples.add(buffer.short.toInt() / 32768f) }
              decoder.releaseOutputBuffer(oi, false)
              if ((info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) outputDone = true
            }
          }
        }
      } finally { decoder.stop(); decoder.release() }
      return Decoded(rate, channels, samples.toFloatArray())
    } finally { extractor.release() }
  }

  private fun bassBoost(input: FloatArray, rate: Int, channels: Int, amount: Double): FloatArray {
    val out = input.copyOf(); val alpha = (1.0 - exp(-2.0 * PI * 180.0 / rate)); val gain = (1.0 + amount * 2.5).toFloat(); val low = FloatArray(channels)
    var i = 0; while (i < out.size) { for (c in 0 until channels) { val x = out[i + c]; low[c] += ((x - low[c]) * alpha).toFloat(); out[i + c] = (x + low[c] * (gain - 1f)).coerceIn(-1f, 1f) }; i += channels }; return out
  }
  private fun treble(input: FloatArray, rate: Int, channels: Int, amount: Double): FloatArray {
    val out = input.copyOf(); val alpha = exp(-2.0 * PI * 3200.0 / rate).toFloat(); val prev = FloatArray(channels); val gain = 1f + amount.toFloat() * 1.8f
    var i = 0; while (i < out.size) { for (c in 0 until channels) { val x = out[i + c]; val low = alpha * prev[c] + (1f - alpha) * x; prev[c] = low; out[i + c] = (x + (x - low) * (gain - 1f)).coerceIn(-1f, 1f) }; i += channels }; return out
  }
  private fun vibrato(input: FloatArray, rate: Int, channels: Int, amount: Double): FloatArray {
    val out = FloatArray(input.size); val frames = input.size / channels; val depth = 0.002 + amount * 0.012; val lfoHz = 5.0 + amount * 2.0
    for (f in 0 until frames) { val delay = (depth * rate * (0.5 + 0.5 * sin(2.0 * PI * lfoHz * f / rate))).toInt(); val src = (f - delay).coerceAtLeast(0); for (c in 0 until channels) out[f * channels + c] = input[src * channels + c] }; return out
  }
  private fun echo(input: FloatArray, rate: Int, channels: Int, amount: Double): FloatArray {
    val delay = (rate * (0.16 + 0.18 * amount)).toInt().coerceAtLeast(1); val out = input.copyOf(); val feedback = (0.18 + amount * 0.3).toFloat()
    for (f in delay until input.size / channels) for (c in 0 until channels) { val idx = f * channels + c; out[idx] = (out[idx] + out[(f - delay) * channels + c] * feedback).coerceIn(-1f, 1f) }; return out
  }
  private fun telephone(input: FloatArray, rate: Int, channels: Int, amount: Double): FloatArray {
    val out = FloatArray(input.size); val lowA = exp(-2.0 * PI * 300.0 / rate).toFloat(); val highA = exp(-2.0 * PI * 3000.0 / rate).toFloat(); val low = FloatArray(channels); val high = FloatArray(channels)
    var i = 0; while (i < input.size) { for (c in 0 until channels) { val x = input[i + c]; low[c] = lowA * low[c] + (1f - lowA) * x; high[c] = highA * high[c] + (1f - highA) * x; val band = high[c] - low[c]; out[i + c] = ((1f - amount.toFloat()) * x + band * (0.9f + amount.toFloat() * 1.8f)).coerceIn(-1f, 1f) }; i += channels }; return out
  }
  private fun robot(input: FloatArray, rate: Int, channels: Int, amount: Double): FloatArray {
    val out = input.copyOf(); val carrier = 55.0 + amount * 80.0
    for (f in 0 until input.size / channels) { val mod = sin(2.0 * PI * carrier * f / rate).toFloat(); for (c in 0 until channels) out[f * channels + c] = (input[f * channels + c] * (1f - amount.toFloat()) + input[f * channels + c] * mod * amount.toFloat()).coerceIn(-1f, 1f) }; return out
  }
  private fun reverb(input: FloatArray, rate: Int, channels: Int, amount: Double): FloatArray {
    val out = input.copyOf(); val taps = intArrayOf((rate * 0.04).toInt(), (rate * 0.085).toInt(), (rate * 0.14).toInt()); val gains = floatArrayOf(0.24f, 0.17f, 0.11f)
    for (f in 0 until input.size / channels) for (c in 0 until channels) { var s = input[f * channels + c].toDouble(); for (j in taps.indices) if (f >= taps[j]) s += out[(f - taps[j]) * channels + c] * gains[j] * amount; out[f * channels + c] = s.coerceIn(-1.0, 1.0).toFloat() }; return out
  }
  private fun reverbDelay(input: FloatArray, rate: Int, channels: Int, preset: String, amount: Double, delayMs: Double, feedback: Double): FloatArray {
    val (early, late, lateGain, tailMs) = when (preset) {
      "small-room" -> Quad(0.018, 0.055, 0.16, 180.0)
      "hall" -> Quad(0.045, 0.12, 0.13, 700.0)
      "cave" -> Quad(0.08, 0.24, 0.11, 1100.0)
      else -> Quad(0.12, 0.42, 0.095, 1500.0)
    }
    val earlyFrames = maxOf(1, (early * rate).toInt()); val lateFrames = maxOf(2, (late * rate).toInt()); val delayFrames = maxOf(1, (delayMs * rate / 1000.0).toInt()); val tailFrames = maxOf(earlyFrames, (tailMs * rate / 1000.0).toInt())
    val base = input.size / channels
    val frames = base + minOf(rate * 2, tailFrames + delayFrames)
    val out = FloatArray(frames * channels)
    for (f in 0 until base) for (c in 0 until channels) out[f * channels + c] = input[f * channels + c]
    for (f in 0 until frames) for (c in 0 until channels) {
      val dry = out[f * channels + c].toDouble()
      var wet = 0.0
      if (f >= earlyFrames) wet += out[(f - earlyFrames) * channels + c] * (0.24 * amount)
      if (f >= lateFrames) wet += out[(f - lateFrames) * channels + c] * (lateGain * amount)
      if (f >= delayFrames) wet += out[(f - delayFrames) * channels + c] * (0.16 * feedback)
      if (f >= earlyFrames && f - earlyFrames < tailFrames) wet += out[(f - earlyFrames) * channels + c] * (0.06 * amount * (1.0 - (f.toDouble() / frames)))
      out[f * channels + c] = (dry + wet).coerceIn(-1.0, 1.0).toFloat()
    }
    return out
  }
  private data class Quad(val early: Double, val late: Double, val gain: Double, val tail: Double)
  private fun megaphone(input: FloatArray, rate: Int, channels: Int, amount: Double): FloatArray = telephone(input, rate, channels, amount).map { tanh(it * (1.4f + amount.toFloat() * 2.3f)).toFloat() }.toFloatArray()

  private fun encodeAac(samples: FloatArray, rate: Int, channels: Int, path: String): String {
    val file = File(path); file.parentFile?.mkdirs()
    val format = MediaFormat.createAudioFormat("audio/mp4a-latm", rate, channels)
    format.setInteger(MediaFormat.KEY_BIT_RATE, minOf(192_000, maxOf(64_000, 64_000 * channels)))
    format.setInteger(MediaFormat.KEY_AAC_PROFILE, MediaCodecInfo.CodecProfileLevel.AACObjectLC)
    val encoder = MediaCodec.createEncoderByType("audio/mp4a-latm")
    val muxer = MediaMuxer(file.absolutePath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
    val info = MediaCodec.BufferInfo(); var track = -1; var started = false; var offset = 0; var eos = false
    try {
      encoder.configure(format, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE); encoder.start(); var done = false
      while (!done) {
        if (!eos) {
          val idx = encoder.dequeueInputBuffer(10_000)
          if (idx >= 0) {
            val buffer = encoder.getInputBuffer(idx) ?: error("Encoder input unavailable."); buffer.clear(); val cap = buffer.remaining() / (2 * channels); val total = samples.size / channels; val remain = total - offset; val count = minOf(cap, remain)
            if (count <= 0) { encoder.queueInputBuffer(idx, 0, 0, offset.toLong() * 1_000_000L / rate, MediaCodec.BUFFER_FLAG_END_OF_STREAM); eos = true }
            else { var bytes = 0; for (f in 0 until count) for (c in 0 until channels) { val s = (samples[(offset + f) * channels + c].coerceIn(-1f, 1f) * 32767f).toInt().toShort(); buffer.put((s.toInt() and 255).toByte()); buffer.put(((s.toInt() shr 8) and 255).toByte()); bytes += 2 }; encoder.queueInputBuffer(idx, 0, bytes, offset.toLong() * 1_000_000L / rate, 0); offset += count }
          }
        }
        when (val oi = encoder.dequeueOutputBuffer(info, 10_000)) {
          MediaCodec.INFO_TRY_AGAIN_LATER -> Unit
          MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> if (!started) { track = muxer.addTrack(encoder.outputFormat); muxer.start(); started = true }
          else -> if (oi >= 0) {
            val buffer = encoder.getOutputBuffer(oi) ?: error("Encoder output unavailable.")
            val codecConfig = (info.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG) != 0
            if (info.size > 0 && !codecConfig) { require(started && track >= 0); buffer.position(info.offset); buffer.limit(info.offset + info.size); muxer.writeSampleData(track, buffer, info) }
            if ((info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) done = true
            encoder.releaseOutputBuffer(oi, false)
          }
        }
      }
    } finally {
      try { encoder.stop() } catch (_: Exception) { }
      encoder.release()
      if (started) try { muxer.stop() } catch (_: Exception) { }
      muxer.release()
    }
    return file.absolutePath
  }
}
