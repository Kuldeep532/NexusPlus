package expo.modules.audioeditornative

import android.content.Context
import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMuxer
import android.net.Uri
import java.io.File
import java.nio.ByteBuffer
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin
import kotlin.math.sqrt
import kotlin.math.tan

internal object VoicePitchProcessor {
  data class Result(
    val outputPath: String,
    val durationMs: Double,
    val sampleRate: Int,
    val channels: Int,
    val mimeType: String,
  )

  fun process(context: Context, inputPath: String, outputPath: String, pitchSemitones: Double, formantShift: Double, timbre: Double): Result {
    require(inputPath.isNotBlank()) { "Input audio path is required." }
    require(outputPath.isNotBlank()) { "Output audio path is required." }
    require(pitchSemitones.isFinite() && pitchSemitones in -8.0..8.0) { "Pitch must be between -8 and +8 semitones." }
    require(formantShift.isFinite() && formantShift in -4.0..4.0) { "Formant shift must be between -4 and +4." }
    require(timbre.isFinite() && timbre in 0.0..1.0) { "Timbre must be between 0 and 1." }

    val decoded = decodePcm(context, inputPath)
    val shiftedRate = pitchShiftRatio(pitchSemitones)
    val stretched = resampleAndShape(decoded.samples, decoded.sampleRate, decoded.channels, shiftedRate, formantShift, timbre)
    val output = encodeAac(stretched, decoded.sampleRate, decoded.channels, outputPath)
    return Result(output, stretched.size.toDouble() / decoded.channels / decoded.sampleRate * 1000.0, decoded.sampleRate, decoded.channels, "audio/mp4")
  }

  private data class Decoded(val sampleRate: Int, val channels: Int, val samples: FloatArray)

  private fun decodePcm(context: Context, inputPath: String): Decoded {
    val extractor = MediaExtractor()
    setDataSource(context, extractor, inputPath)
    try {
      var track = -1
      var format: MediaFormat? = null
      for (i in 0 until extractor.trackCount) {
        val candidate = extractor.getTrackFormat(i)
        val mime = candidate.getString(MediaFormat.KEY_MIME) ?: continue
        if (mime.startsWith("audio/")) {
          track = i
          format = candidate
          break
        }
      }
      require(track >= 0 && format != null) { "No supported audio track was found." }
      val inputFormat = format!!
      val mime = inputFormat.getString(MediaFormat.KEY_MIME) ?: error("Audio codec MIME type is missing.")
      val sampleRate = inputFormat.getInteger(MediaFormat.KEY_SAMPLE_RATE)
      val channels = inputFormat.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
      extractor.selectTrack(track)
      val decoder = MediaCodec.createDecoderByType(mime)
      decoder.configure(inputFormat, null, null, 0)
      decoder.start()
      val info = MediaCodec.BufferInfo()
      val samples = ArrayList<Float>()
      var inputDone = false
      var outputDone = false
      try {
        while (!outputDone) {
          if (!inputDone) {
            val index = decoder.dequeueInputBuffer(10_000)
            if (index >= 0) {
              val buffer = decoder.getInputBuffer(index) ?: error("Decoder input buffer unavailable.")
              buffer.clear()
              val size = extractor.readSampleData(buffer, 0)
              if (size < 0) {
                decoder.queueInputBuffer(index, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM)
                inputDone = true
              } else {
                decoder.queueInputBuffer(index, 0, size, extractor.sampleTime.coerceAtLeast(0), extractor.sampleFlags)
                extractor.advance()
              }
            }
          }
          when (val outputIndex = decoder.dequeueOutputBuffer(info, 10_000)) {
            MediaCodec.INFO_TRY_AGAIN_LATER, MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> Unit
            else -> if (outputIndex >= 0) {
              val buffer = decoder.getOutputBuffer(outputIndex) ?: error("Decoder output buffer unavailable.")
              if (info.size > 0) {
                buffer.position(info.offset)
                buffer.limit(info.offset + info.size)
                while (buffer.remaining() >= 2) samples.add(buffer.short.toInt() / 32768.0f)
              }
              decoder.releaseOutputBuffer(outputIndex, false)
              if ((info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) outputDone = true
            }
          }
        }
      } finally {
        decoder.stop()
        decoder.release()
      }
      return Decoded(sampleRate, channels, samples.toFloatArray())
    } finally {
      extractor.release()
    }
  }

  private fun setDataSource(context: Context, extractor: MediaExtractor, inputPath: String) {
    when {
      inputPath.startsWith("content://") || inputPath.startsWith("file://") -> {
        val descriptor = context.contentResolver.openFileDescriptor(Uri.parse(inputPath), "r")
        requireNotNull(descriptor) { "Unable to open recorded audio." }
        descriptor.use { extractor.setDataSource(it.fileDescriptor) }
      }
      File(inputPath).isFile -> extractor.setDataSource(inputPath)
      else -> error("Input audio file was not found.")
    }
  }

  private fun pitchShiftRatio(semitones: Double): Double = 2.0.pow(semitones / 12.0)

  private fun resampleAndShape(input: FloatArray, sampleRate: Int, channels: Int, ratio: Double, formantShift: Double, timbre: Double): FloatArray {
    if (input.isEmpty()) return input
    if (abs(ratio - 1.0) < 0.0001 && abs(formantShift) < 0.0001 && abs(timbre - 0.5) < 0.0001) return input

    val frames = input.size / channels
    val outputFrames = max(1, (frames / ratio).roundToInt())
    val output = FloatArray(outputFrames * channels)
    val warmth = 0.85 + timbre * 0.3
    val brightness = 0.7 + timbre * 0.6
    val formantRatio = 2.0.pow(formantShift / 12.0)

    for (frame in 0 until outputFrames) {
      val sourcePosition = frame * ratio
      val sourceFrame = min(frames - 1, sourcePosition.toInt())
      val nextFrame = min(frames - 1, sourceFrame + 1)
      val fraction = (sourcePosition - sourceFrame).toFloat()
      for (channel in 0 until channels) {
        val a = input[sourceFrame * channels + channel]
        val b = input[nextFrame * channels + channel]
        var sample = a + (b - a) * fraction
        val previousIndex = max(0, frame - 1) * channels + channel
        val previous = output[previousIndex]
        sample = sample * warmth + (sample - previous) * 0.08f * brightness.toFloat()
        val formantPhase = frame.toDouble() / max(1, sampleRate) * formantRatio
        sample = (sample * cos(2.0 * PI * formantPhase * 0.5) + previous * sin(2.0 * PI * formantPhase * 0.5)).toFloat() * 0.92f
        output[frame * channels + channel] = sample.coerceIn(-1f, 1f)
      }
    }
    return output
  }

  private fun encodeAac(samples: FloatArray, sampleRate: Int, channels: Int, outputPath: String): String {
    val outFile = File(outputPath)
    outFile.parentFile?.mkdirs()
    val encoderFormat = MediaFormat.createAudioFormat("audio/mp4a-latm", sampleRate, channels)
    encoderFormat.setInteger(MediaFormat.KEY_BIT_RATE, min(192_000, max(64_000, 64_000 * channels)))
    encoderFormat.setInteger(MediaFormat.KEY_AAC_PROFILE, android.media.MediaCodecInfo.CodecProfileLevel.AACObjectLC)

    val encoder = MediaCodec.createEncoderByType("audio/mp4a-latm")
    val muxer = MediaMuxer(outFile.absolutePath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
    val info = MediaCodec.BufferInfo()
    var muxerTrack = -1
    var muxerStarted = false
    var inputFrameOffset = 0
    var endOfInput = false
    try {
      encoder.configure(encoderFormat, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
      encoder.start()
      var outputDone = false
      while (!outputDone) {
        if (!endOfInput) {
          val inputIndex = encoder.dequeueInputBuffer(10_000)
          if (inputIndex >= 0) {
            val buffer = encoder.getInputBuffer(inputIndex) ?: error("Encoder input buffer unavailable.")
            buffer.clear()
            val maxBytes = buffer.remaining()
            val framesCapacity = maxBytes / (2 * channels)
            val totalFrames = samples.size / channels
            val remainingFrames = totalFrames - inputFrameOffset
            val frames = min(framesCapacity, remainingFrames)
            if (frames <= 0) {
              val ptsUs = (inputFrameOffset.toLong() * 1_000_000L / sampleRate)
              encoder.queueInputBuffer(inputIndex, 0, 0, ptsUs, MediaCodec.BUFFER_FLAG_END_OF_STREAM)
              endOfInput = true
            } else {
              val bytes = ByteArray(frames * channels * 2)
              var offset = 0
              for (frame in 0 until frames) for (channel in 0 until channels) {
                val value = (samples[(inputFrameOffset + frame) * channels + channel].coerceIn(-1f, 1f) * 32767f).toInt().toShort()
                bytes[offset++] = (value.toInt() and 0xff).toByte()
                bytes[offset++] = ((value.toInt() shr 8) and 0xff).toByte()
              }
              buffer.put(bytes)
              val ptsUs = inputFrameOffset.toLong() * 1_000_000L / sampleRate
              encoder.queueInputBuffer(inputIndex, 0, bytes.size, ptsUs, 0)
              inputFrameOffset += frames
            }
          }
        }

        when (val outputIndex = encoder.dequeueOutputBuffer(info, 10_000)) {
          MediaCodec.INFO_TRY_AGAIN_LATER -> Unit
          MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
            if (!muxerStarted) {
              muxerTrack = muxer.addTrack(encoder.outputFormat)
              muxer.start()
              muxerStarted = true
            }
          }
          else -> if (outputIndex >= 0) {
            val outputBuffer = encoder.getOutputBuffer(outputIndex) ?: error("Encoder output buffer unavailable.")
            if ((info.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG) != 0) info.size = 0
            if (info.size > 0) {
              require(muxerStarted && muxerTrack >= 0) { "Audio encoder did not produce an output format." }
              outputBuffer.position(info.offset)
              outputBuffer.limit(info.offset + info.size)
              muxer.writeSampleData(muxerTrack, outputBuffer, info)
            }
            encoder.releaseOutputBuffer(outputIndex, false)
            if ((info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) outputDone = true
          }
        }
      }
    } finally {
      runCatching { encoder.stop() }
      encoder.release()
      if (muxerStarted) muxer.stop()
      muxer.release()
    }
    return outFile.absolutePath
  }

  private fun Double.roundToInt(): Int = kotlin.math.round(this).toInt()
  private fun Double.pow(exponent: Double): Double = kotlin.math.exp(exponent * kotlin.math.ln(this))
}
