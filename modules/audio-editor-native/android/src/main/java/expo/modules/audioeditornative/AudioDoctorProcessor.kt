package expo.modules.audioeditornative

import android.content.Context
import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMuxer
import android.net.Uri
import java.io.File
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.exp
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sqrt
import kotlin.math.tanh

internal object AudioDoctorProcessor {
  data class Result(
    val outputPath: String,
    val durationMs: Double,
    val sampleRate: Int,
    val channels: Int,
    val mimeType: String,
    val originalPeak: Double,
    val repairedPeak: Double,
    val noiseFloorDb: Double,
    val estimatedSnrDb: Double,
    val clippingRatio: Double,
    val hasClipping: Boolean,
    val hasHum: Boolean,
    val hasSevereNoise: Boolean,
    val hasLikelyCodecDamage: Boolean,
    val repairable: Boolean,
    val repairedNoise: Boolean,
    val repairedClipping: Boolean,
    val repairedHum: Boolean,
    val diagnosis: List<String>,
    val attribution: String = "not-determinable-from-audio-alone"
  )

  private data class Decoded(val sampleRate: Int, val channels: Int, val samples: FloatArray)

  fun process(
    context: Context,
    inputPath: String,
    outputPath: String,
    noiseReduction: Double,
    voiceClarity: Double,
    humRemoval: Double,
    deClip: Double,
    autoGain: Boolean,
  ): Result {
    require(noiseReduction in 0.0..1.0 && voiceClarity in 0.0..1.0 && humRemoval in 0.0..1.0 && deClip in 0.0..1.0)

    val decoded = decode(context, inputPath)
    require(decoded.samples.isNotEmpty()) { "The selected audio contains no decodable samples." }

    val samples = decoded.samples
    val frames = samples.size / decoded.channels
    val peak = peak(samples)
    val clippingRatio = clippedRatio(samples)
    val noiseFloor = estimateNoiseFloorDb(samples, decoded.channels)
    val snr = estimateSnrDb(peak, noiseFloor)
    val hasClipping = clippingRatio >= 0.002 || peak >= 0.999f
    val hasHum = detectHum(samples, decoded.sampleRate, decoded.channels)
    val hasSevereNoise = snr < 8.0
    val hasLikelyCodecDamage = detectCodecDamage(samples, decoded.sampleRate, decoded.channels)

    val diagnosis = ArrayList<String>()
    if (hasClipping) diagnosis.add("Clipping detected: peaks are flattened near the digital ceiling.")
    if (hasHum) diagnosis.add("Possible electrical hum detected near mains-frequency harmonics.")
    if (hasSevereNoise) diagnosis.add("Heavy background noise detected; the estimated signal-to-noise ratio is low.")
    if (hasLikelyCodecDamage) diagnosis.add("Possible codec/compression damage detected from high-frequency loss or quantization-like artifacts.")
    if (diagnosis.isEmpty()) diagnosis.add("No major structural damage was detected by the audio-signal checks.")

    val processed = samples.copyOf()
    var repairedNoise = false
    var repairedHum = false
    var repairedClipping = false

    if (noiseReduction > 0.0 && hasSevereNoise) {
      spectralLikeNoiseGate(processed, decoded.sampleRate, decoded.channels, noiseFloor, noiseReduction)
      repairedNoise = true
    } else if (noiseReduction > 0.0 && snr < 14.0) {
      spectralLikeNoiseGate(processed, decoded.sampleRate, decoded.channels, noiseFloor, noiseReduction * 0.55)
      repairedNoise = true
    }

    if (humRemoval > 0.0 && hasHum) {
      removeHum(processed, decoded.sampleRate, decoded.channels, humRemoval)
      repairedHum = true
    }

    if (deClip > 0.0 && hasClipping) {
      softDeclip(processed, deClip)
      repairedClipping = true
    }

    if (voiceClarity > 0.0) {
      clarityEnhance(processed, decoded.sampleRate, decoded.channels, voiceClarity)
    }

    if (autoGain) {
      normalizePeak(processed, target = 0.92f)
    }

    val repairedPeak = peak(processed)
    val repairable = !(hasLikelyCodecDamage && hasSevereNoise && hasClipping && clippingRatio > 0.15)
    val out = encodeAac(processed, decoded.sampleRate, decoded.channels, outputPath)

    return Result(
      out,
      frames.toDouble() / decoded.sampleRate * 1000.0,
      decoded.sampleRate,
      decoded.channels,
      "audio/mp4",
      peak.toDouble(),
      repairedPeak.toDouble(),
      noiseFloor,
      snr,
      clippingRatio,
      hasClipping,
      hasHum,
      hasSevereNoise,
      hasLikelyCodecDamage,
      repairable,
      repairedNoise,
      repairedClipping,
      repairedHum,
      diagnosis,
    )
  }

  private fun peak(samples: FloatArray): Float {
    var value = 0f
    for (sample in samples) value = max(value, abs(sample))
    return value
  }

  private fun clippedRatio(samples: FloatArray): Double {
    if (samples.isEmpty()) return 0.0
    var clipped = 0
    for (sample in samples) if (abs(sample) >= 0.995f) clipped++
    return clipped.toDouble() / samples.size
  }

  private fun estimateNoiseFloorDb(samples: FloatArray, channels: Int): Double {
    val frames = samples.size / channels
    if (frames < 100) return -60.0
    val tailFrames = min(frames, 30 * 1000)
    var sumSq = 0.0
    var count = 0
    var frame = max(0, frames - tailFrames)
    while (frame < frames) {
      var c = 0
      var energy = 0.0
      while (c < channels) {
        val s = samples[frame * channels + c].toDouble()
        energy += s * s
        c++
      }
      sumSq += energy / channels
      count++
      frame++
    }
    val rms = sqrt(sumSq / max(1, count)).coerceAtLeast(1e-8)
    return 20.0 * kotlin.math.log10(rms)
  }

  private fun estimateSnrDb(peak: Float, noiseFloorDb: Double): Double =
    (20.0 * kotlin.math.log10(max(peak.toDouble(), 1e-6)) - noiseFloorDb).coerceIn(0.0, 120.0)

  private fun detectHum(samples: FloatArray, sampleRate: Int, channels: Int): Boolean {
    val frames = samples.size / channels
    if (frames < sampleRate) return false
    val testSeconds = min(8, frames / sampleRate)
    var bestRatio = 0.0
    val frequencies = doubleArrayOf(50.0, 60.0, 100.0, 120.0, 150.0, 180.0)
    for (frequency in frequencies) {
      var real = 0.0
      var imag = 0.0
      var total = 0.0
      val count = testSeconds * sampleRate
      var frame = frames - count
      while (frame < frames) {
        var mono = 0.0
        var c = 0
        while (c < channels) {
          mono += samples[frame * channels + c]
          c++
        }
        mono /= channels
        val phase = 2.0 * PI * frequency * (frame - (frames - count)) / sampleRate
        real += mono * kotlin.math.cos(phase)
        imag -= mono * kotlin.math.sin(phase)
        total += mono * mono
        frame++
      }
      val tonePower = (real * real + imag * imag) / max(1, count).toDouble()
      val basePower = total / max(1, count).toDouble()
      bestRatio = max(bestRatio, tonePower / max(basePower, 1e-9))
    }
    return bestRatio > 0.06
  }

  private fun detectCodecDamage(samples: FloatArray, sampleRate: Int, channels: Int): Boolean {
    if (sampleRate < 22050 || samples.size < channels * 4096) return false
    var changes = 0
    var quantized = 0
    var i = channels
    while (i < min(samples.size, channels * 200_000)) {
      val prev = samples[i - channels]
      val current = samples[i]
      val delta = abs(current - prev)
      if (delta > 0f) changes++
      if (delta < 0.0002f) quantized++
      i += channels
    }
    val ratio = quantized.toDouble() / max(1, changes)
    val highFrequencyLoss = zeroCrossingRate(samples, channels, 5000, sampleRate)
    return ratio > 0.42 && highFrequencyLoss < 0.015
  }

  private fun zeroCrossingRate(samples: FloatArray, channels: Int, minHz: Int, sampleRate: Int): Double {
    val frames = samples.size / channels
    val start = min(frames, sampleRate)
    val end = min(frames, sampleRate * 6)
    var crossings = 0
    var count = 0
    var previous = 0.0
    var frame = start
    while (frame < end) {
      var mono = 0.0
      var c = 0
      while (c < channels) { mono += samples[frame * channels + c]; c++ }
      mono /= channels
      if ((mono >= 0) != (previous >= 0)) crossings++
      previous = mono
      count++
      frame++
    }
    return crossings.toDouble() / max(1, count) / max(1.0, minHz / 1000.0)
  }

  private fun spectralLikeNoiseGate(samples: FloatArray, sampleRate: Int, channels: Int, noiseDb: Double, amount: Double) {
    val threshold = 10.0.pow10((noiseDb + 8.0) / 20.0)
    val attack = exp(-1.0 / max(1.0, sampleRate * 0.005)).toFloat()
    val release = exp(-1.0 / max(1.0, sampleRate * 0.08)).toFloat()
    val envelope = FloatArray(channels)
    var i = 0
    while (i < samples.size) {
      for (c in 0 until channels) {
        val x = samples[i + c]
        val rectified = abs(x)
        val coeff = if (rectified > envelope[c]) attack else release
        envelope[c] = coeff * envelope[c] + (1f - coeff) * rectified
        val gate = if (envelope[c] <= threshold) 1.0 - amount * 0.88 else 1.0
        samples[i + c] = (x * gate.toFloat()).coerceIn(-1f, 1f)
      }
      i += channels
    }
  }

  private fun removeHum(samples: FloatArray, sampleRate: Int, channels: Int, amount: Double) {
    val frequencies = if (sampleRate >= 48_000) doubleArrayOf(50.0, 100.0, 150.0, 60.0, 120.0, 180.0) else doubleArrayOf(50.0, 100.0, 150.0, 60.0, 120.0)
    val strength = (0.85 * amount).toFloat()
    var frame = 0
    val frames = samples.size / channels
    while (frame < frames) {
      for (c in 0 until channels) {
        var y = samples[frame * channels + c].toDouble()
        for (frequency in frequencies.take(3)) {
          val phase = 2.0 * PI * frequency * frame / sampleRate
          y -= sinWaveProjection(samples, sampleRate, channels, c, frame, frequency) * strength
        }
        samples[frame * channels + c] = y.coerceIn(-1.0, 1.0).toFloat()
      }
      frame++
    }
  }

  private fun sinWaveProjection(samples: FloatArray, sampleRate: Int, channels: Int, channel: Int, frame: Int, frequency: Double): Double {
    val period = max(8, (sampleRate / frequency).toInt())
    var real = 0.0
    var imag = 0.0
    var energy = 0.0
    val start = max(0, frame - period * 2)
    var i = start
    while (i <= frame) {
      val value = samples[i * channels + channel].toDouble()
      val phase = 2.0 * PI * frequency * (i - start) / sampleRate
      real += value * kotlin.math.cos(phase)
      imag += value * kotlin.math.sin(phase)
      energy += 1.0
      i++
    }
    return if (energy <= 0) 0.0 else (2.0 / energy) * (real * kotlin.math.cos(2.0 * PI * frequency * (frame - start) / sampleRate) + imag * kotlin.math.sin(2.0 * PI * frequency * (frame - start) / sampleRate))
  }

  private fun softDeclip(samples: FloatArray, amount: Double) {
    val threshold = (0.82 - amount * 0.18).toFloat()
    for (i in samples.indices) {
      val x = samples[i]
      val a = abs(x)
      if (a > threshold) {
        val excess = (a - threshold) / max(1e-6f, 1f - threshold)
        val softened = threshold + (1f - threshold) * tanh(excess * (1.0 - amount * 0.35)).toFloat()
        samples[i] = if (x >= 0) softened else -softened
      }
    }
  }

  private fun clarityEnhance(samples: FloatArray, sampleRate: Int, channels: Int, amount: Double) {
    val alpha = exp(-2.0 * PI * 1800.0 / sampleRate).toFloat()
    val prev = FloatArray(channels)
    val gain = (0.15 * amount).toFloat()
    var i = 0
    while (i < samples.size) {
      for (c in 0 until channels) {
        val x = samples[i + c]
        val low = alpha * prev[c] + (1f - alpha) * x
        prev[c] = low
        samples[i + c] = (x + (x - low) * gain).coerceIn(-1f, 1f)
      }
      i += channels
    }
  }

  private fun normalizePeak(samples: FloatArray, target: Float) {
    val p = peak(samples)
    if (p <= 0f || p > target) return
    val gain = target / p
    for (i in samples.indices) samples[i] = (samples[i] * gain).coerceIn(-1f, 1f)
  }

  private fun decode(context: Context, inputPath: String): Decoded {
    val extractor = MediaExtractor()
    try {
      when {
        inputPath.startsWith("content://") || inputPath.startsWith("file://") -> {
          val descriptor = context.contentResolver.openFileDescriptor(Uri.parse(inputPath), "r")
          requireNotNull(descriptor) { "Unable to open audio file." }
          descriptor.use { extractor.setDataSource(it.fileDescriptor) }
        }
        File(inputPath).isFile -> extractor.setDataSource(inputPath)
        else -> error("Input audio file was not found.")
      }
      var track = -1
      var format: MediaFormat? = null
      for (i in 0 until extractor.trackCount) {
        val candidate = extractor.getTrackFormat(i)
        val mime = candidate.getString(MediaFormat.KEY_MIME) ?: continue
        if (mime.startsWith("audio/")) { track = i; format = candidate; break }
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
      val info = MediaCodec.BufferInfo()
      val values = ArrayList<Float>()
      var inputDone = false
      var outputDone = false
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
              if (info.size > 0) { buffer.position(info.offset); buffer.limit(info.offset + info.size); while (buffer.remaining() >= 2) values.add(buffer.short.toInt() / 32768f) }
              decoder.releaseOutputBuffer(oi, false)
              if ((info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) outputDone = true
            }
          }
        }
      } finally { decoder.stop(); decoder.release() }
      return Decoded(rate, channels, values.toFloatArray())
    } finally { extractor.release() }
  }

  private fun encodeAac(samples: FloatArray, rate: Int, channels: Int, path: String): String {
    val file = File(path); file.parentFile?.mkdirs()
    val format = MediaFormat.createAudioFormat("audio/mp4a-latm", rate, channels)
    format.setInteger(MediaFormat.KEY_BIT_RATE, minOf(192_000, maxOf(64_000, 64_000 * channels)))
    format.setInteger(MediaFormat.KEY_AAC_PROFILE, android.media.MediaCodecInfo.CodecProfileLevel.AACObjectLC)
    val encoder = MediaCodec.createEncoderByType("audio/mp4a-latm")
    val muxer = MediaMuxer(file.absolutePath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
    val info = MediaCodec.BufferInfo()
    var track = -1; var started = false; var offset = 0; var eos = false
    try {
      encoder.configure(format, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE); encoder.start(); var done = false
      while (!done) {
        if (!eos) {
          val idx = encoder.dequeueInputBuffer(10_000)
          if (idx >= 0) {
            val buffer = encoder.getInputBuffer(idx) ?: error("Encoder input unavailable."); buffer.clear()
            val capacityFrames = buffer.remaining() / (2 * channels); val totalFrames = samples.size / channels; val remaining = totalFrames - offset; val count = min(capacityFrames, remaining)
            if (count <= 0) { encoder.queueInputBuffer(idx, 0, 0, offset.toLong() * 1_000_000L / rate, MediaCodec.BUFFER_FLAG_END_OF_STREAM); eos = true }
            else {
              var bytes = 0
              for (f in 0 until count) for (c in 0 until channels) { val s = (samples[(offset + f) * channels + c].coerceIn(-1f, 1f) * 32767f).toInt().toShort(); buffer.put((s.toInt() and 255).toByte()); buffer.put(((s.toInt() shr 8) and 255).toByte()); bytes += 2 }
              encoder.queueInputBuffer(idx, 0, bytes, offset.toLong() * 1_000_000L / rate, 0); offset += count
            }
          }
        }
        when (val oi = encoder.dequeueOutputBuffer(info, 10_000)) {
          MediaCodec.INFO_TRY_AGAIN_LATER -> Unit
          MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> if (!started) { track = muxer.addTrack(encoder.outputFormat); muxer.start(); started = true }
          else -> if (oi >= 0) {
            val buffer = encoder.getOutputBuffer(oi) ?: error("Encoder output unavailable.")
            if ((info.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG) != 0) info.size = 0
            if (info.size > 0) { buffer.position(info.offset); buffer.limit(info.offset + info.size); require(started); muxer.writeSampleData(track, buffer, info) }
            encoder.releaseOutputBuffer(oi, false)
            if ((info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) done = true
          }
        }
      }
    } finally { runCatching { encoder.stop() }; encoder.release(); if (started) muxer.stop(); muxer.release() }
    return file.absolutePath
  }
}
