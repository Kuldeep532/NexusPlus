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
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.math.sin

internal object SpeedPitchProcessor {
  data class Result(
    val outputPath: String,
    val durationMs: Double,
    val sampleRate: Int,
    val channels: Int,
    val mimeType: String,
  )

  fun process(context: Context, inputPath: String, outputPath: String, speed: Double, pitchSemitones: Double): Result {
    require(inputPath.isNotBlank()) { "Input audio path is required." }
    require(outputPath.isNotBlank()) { "Output audio path is required." }
    require(speed.isFinite() && speed in 0.5..2.0) { "Speed must be between 0.5x and 2.0x." }
    require(pitchSemitones.isFinite() && pitchSemitones in -8.0..8.0) { "Pitch must be between -8 and +8 semitones." }

    val decoded = decodePcm(context, inputPath)
    require(decoded.samples.isNotEmpty()) { "The audio file contains no samples." }

    val pitchRatio = kotlin.math.exp(kotlin.math.ln(2.0) * pitchSemitones / 12.0)
    val pitched = if (abs(pitchRatio - 1.0) < 0.0001) decoded.samples.copyOf() else pitchPreservingTime(pitchTime(decoded.samples, decoded.sampleRate, decoded.channels, pitchRatio), decoded.samples.size)
    val speedAdjusted = changeSpeedPreservingPitch(pitched, decoded.sampleRate, decoded.channels, speed)
    val encoded = encodeAac(speedAdjusted, decoded.sampleRate, decoded.channels, outputPath)
    return Result(encoded, speedAdjusted.size.toDouble() / decoded.channels / decoded.sampleRate * 1000.0, decoded.sampleRate, decoded.channels, "audio/mp4")
  }

  private data class Decoded(val sampleRate: Int, val channels: Int, val samples: FloatArray)

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
      var track = -1
      var format: MediaFormat? = null
      for (i in 0 until extractor.trackCount) {
        val candidate = extractor.getTrackFormat(i)
        val mime = candidate.getString(MediaFormat.KEY_MIME) ?: continue
        if (mime.startsWith("audio/")) { track = i; format = candidate; break }
      }
      require(track >= 0 && format != null) { "No supported audio track was found." }
      val inputFormat = format!!
      val sampleRate = inputFormat.getInteger(MediaFormat.KEY_SAMPLE_RATE)
      val channels = inputFormat.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
      val mime = inputFormat.getString(MediaFormat.KEY_MIME) ?: error("Audio codec MIME type is missing.")
      extractor.selectTrack(track)
      val decoder = MediaCodec.createDecoderByType(mime)
      decoder.configure(inputFormat, null, null, 0)
      decoder.start()
      val info = MediaCodec.BufferInfo()
      val samples = ArrayList<Float>()
      var inputDone = false; var outputDone = false
      try {
        while (!outputDone) {
          if (!inputDone) {
            val inputIndex = decoder.dequeueInputBuffer(10_000)
            if (inputIndex >= 0) {
              val buffer = decoder.getInputBuffer(inputIndex) ?: error("Decoder input buffer unavailable.")
              buffer.clear(); val size = extractor.readSampleData(buffer, 0)
              if (size < 0) { decoder.queueInputBuffer(inputIndex, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM); inputDone = true }
              else { decoder.queueInputBuffer(inputIndex, 0, size, extractor.sampleTime.coerceAtLeast(0), extractor.sampleFlags); extractor.advance() }
            }
          }
          when (val outputIndex = decoder.dequeueOutputBuffer(info, 10_000)) {
            MediaCodec.INFO_TRY_AGAIN_LATER, MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> Unit
            else -> if (outputIndex >= 0) {
              val buffer = decoder.getOutputBuffer(outputIndex) ?: error("Decoder output unavailable.")
              if (info.size > 0) {
                buffer.position(info.offset); buffer.limit(info.offset + info.size)
                while (buffer.remaining() >= 2) samples.add(buffer.short.toInt() / 32768f)
              }
              decoder.releaseOutputBuffer(outputIndex, false)
              if ((info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) outputDone = true
            }
          }
        }
      } finally { decoder.stop(); decoder.release() }
      return Decoded(sampleRate, channels, samples.toFloatArray())
    } finally { extractor.release() }
  }

  private fun pitchTime(input: FloatArray, sampleRate: Int, channels: Int, ratio: Double): FloatArray {
    val frames = input.size / channels
    val window = (sampleRate * 0.032).roundToInt().coerceIn(512, 2048)
    val hop = (window / 4).coerceAtLeast(64)
    val outFrames = max(1, (frames / ratio).roundToInt())
    val out = FloatArray(outFrames * channels)
    val weights = FloatArray(outFrames)
    var inFrame = 0; var outFrame = 0
    while (inFrame < frames && outFrame < outFrames) {
      val remaining = min(window, frames - inFrame)
      for (j in 0 until remaining) {
        val phase = PI * j.toDouble() / max(1, remaining - 1)
        val w = (0.5 - 0.5 * cos(2.0 * phase)).toFloat()
        val dst = outFrame + (j * ratio).roundToInt()
        if (dst >= outFrames) continue
        for (c in 0 until channels) out[dst * channels + c] += input[(inFrame + j) * channels + c] * w
        weights[dst] += w
      }
      inFrame += hop; outFrame += hop
    }
    for (f in 0 until outFrames) {
      val gain = if (weights[f] > 0.0001f) 1f / weights[f] else 1f
      for (c in 0 until channels) out[f * channels + c] = (out[f * channels + c] * gain).coerceIn(-1f, 1f)
    }
    return out
  }

  private fun pitchPreservingTime(input: FloatArray, targetSize: Int): FloatArray {
    if (input.isEmpty() || input.size == targetSize) return input
    val result = FloatArray(targetSize)
    val ratio = (input.size - 1).toDouble() / max(1, targetSize - 1)
    for (i in result.indices) {
      val p = i * ratio
      val a = p.toInt().coerceIn(0, input.size - 1)
      val b = min(input.size - 1, a + 1)
      val t = (p - a).toFloat()
      result[i] = input[a] * (1f - t) + input[b] * t
    }
    return result
  }

  private fun changeSpeedPreservingPitch(input: FloatArray, sampleRate: Int, channels: Int, speed: Double): FloatArray {
    if (abs(speed - 1.0) < 0.0001) return input.copyOf()
    val frames = input.size / channels
    val targetFrames = max(1, (frames / speed).roundToInt())
    val out = FloatArray(targetFrames * channels)
    for (frame in 0 until targetFrames) {
      val source = frame * speed
      val a = source.toInt().coerceIn(0, frames - 1)
      val b = min(frames - 1, a + 1)
      val t = (source - a).toFloat()
      for (c in 0 until channels) out[frame * channels + c] = input[a * channels + c] * (1f - t) + input[b * channels + c] * t
    }
    return out
  }

  private fun encodeAac(samples: FloatArray, sampleRate: Int, channels: Int, outputPath: String): String {
    val outFile = File(outputPath); outFile.parentFile?.mkdirs()
    val format = MediaFormat.createAudioFormat("audio/mp4a-latm", sampleRate, channels)
    format.setInteger(MediaFormat.KEY_BIT_RATE, min(192_000, max(64_000, 64_000 * channels)))
    format.setInteger(MediaFormat.KEY_AAC_PROFILE, android.media.MediaCodecInfo.CodecProfileLevel.AACObjectLC)
    val encoder = MediaCodec.createEncoderByType("audio/mp4a-latm")
    val muxer = MediaMuxer(outFile.absolutePath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
    val info = MediaCodec.BufferInfo(); var track = -1; var started = false; var offsetFrames = 0; var eos = false
    try {
      encoder.configure(format, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE); encoder.start()
      var done = false
      while (!done) {
        if (!eos) {
          val inputIndex = encoder.dequeueInputBuffer(10_000)
          if (inputIndex >= 0) {
            val buffer = encoder.getInputBuffer(inputIndex) ?: error("Encoder input unavailable.")
            buffer.clear(); val capacity = buffer.remaining() / (2 * channels); val total = samples.size / channels; val remaining = total - offsetFrames; val count = min(capacity, remaining)
            if (count <= 0) { encoder.queueInputBuffer(inputIndex, 0, 0, offsetFrames.toLong() * 1_000_000L / sampleRate, MediaCodec.BUFFER_FLAG_END_OF_STREAM); eos = true }
            else {
              var bytes = 0
              for (f in 0 until count) for (c in 0 until channels) {
                val s = (samples[(offsetFrames + f) * channels + c].coerceIn(-1f, 1f) * 32767f).toInt().toShort()
                buffer.put((s.toInt() and 0xff).toByte()); buffer.put(((s.toInt() shr 8) and 0xff).toByte()); bytes += 2
              }
              encoder.queueInputBuffer(inputIndex, 0, bytes, offsetFrames.toLong() * 1_000_000L / sampleRate, 0); offsetFrames += count
            }
          }
        }
        when (val outputIndex = encoder.dequeueOutputBuffer(info, 10_000)) {
          MediaCodec.INFO_TRY_AGAIN_LATER -> Unit
          MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> if (!started) { track = muxer.addTrack(encoder.outputFormat); muxer.start(); started = true }
          else -> if (outputIndex >= 0) {
            val buffer = encoder.getOutputBuffer(outputIndex) ?: error("Encoder output unavailable.")
            if ((info.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG) != 0) info.size = 0
            if (info.size > 0) { buffer.position(info.offset); buffer.limit(info.offset + info.size); require(started); muxer.writeSampleData(track, buffer, info) }
            encoder.releaseOutputBuffer(outputIndex, false)
            if ((info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) done = true
          }
        }
      }
    } finally { runCatching { encoder.stop() }; encoder.release(); if (started) muxer.stop(); muxer.release() }
    return outFile.absolutePath
  }
}
