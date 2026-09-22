package expo.modules.audioeditornative

import android.content.Context
import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMuxer
import android.net.Uri
import java.io.File
import kotlin.math.max
import kotlin.math.min

internal object VocalRemovalProcessor {
  data class Result(
    val outputPath: String,
    val durationMs: Double,
    val sampleRate: Int,
    val channels: Int,
    val mimeType: String,
  )

  fun process(
    context: Context,
    inputPath: String,
    outputPath: String,
    quality: String,
    preserveBass: Boolean,
    preserveStereo: Boolean,
  ): Result {
    val decoded = decode(context, inputPath)
    require(decoded.channels == 2) {
      "Vocal removal needs a stereo audio source. Mono files cannot be separated reliably."
    }

    val processed = FloatArray(decoded.samples.size)
    val bassMix = when (quality) {
      "preview" -> if (preserveBass) 0.18f else 0f
      "studio" -> if (preserveBass) 0.10f else 0f
      else -> if (preserveBass) 0.14f else 0f
    }

    var frame = 0
    val totalFrames = decoded.samples.size / 2
    while (frame < totalFrames) {
      val base = frame * 2
      val left = decoded.samples[base]
      val right = decoded.samples[base + 1]
      val mid = 0.5f * (left + right)
      val side = 0.5f * (left - right)

      if (preserveStereo) {
        processed[base] = side + bassMix * mid
        processed[base + 1] = -side + bassMix * mid
      } else {
        val instrumental = side + bassMix * mid
        processed[base] = instrumental
        processed[base + 1] = instrumental
      }
      frame++
    }

    val output = encodeWav(context, processed, decoded.sampleRate, decoded.channels, outputPath)
    val durationMs = totalFrames.toDouble() / decoded.sampleRate.toDouble() * 1000.0
    return Result(output, durationMs, decoded.sampleRate, decoded.channels, "audio/wav")
  }

  private data class Decoded(val sampleRate: Int, val channels: Int, val samples: FloatArray)

  private fun decode(context: Context, inputPath: String): Decoded {
    val extractor = MediaExtractor()
    try {
      setDataSource(context, extractor, inputPath)
      var audioTrack = -1
      var format: MediaFormat? = null
      for (index in 0 until extractor.trackCount) {
        val candidate = extractor.getTrackFormat(index)
        val mime = candidate.getString(MediaFormat.KEY_MIME) ?: continue
        if (mime.startsWith("audio/")) {
          audioTrack = index
          format = candidate
          break
        }
      }
      require(audioTrack >= 0 && format != null) { "No supported audio track was found." }

      val inputFormat = format!!
      val mime = inputFormat.getString(MediaFormat.KEY_MIME) ?: error("Audio codec MIME type is missing.")
      val sampleRate = inputFormat.getInteger(MediaFormat.KEY_SAMPLE_RATE)
      val channels = inputFormat.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
      require(sampleRate > 0 && channels > 0) { "Audio format has invalid sample rate or channel count." }

      extractor.selectTrack(audioTrack)
      val decoder = MediaCodec.createDecoderByType(mime)
      decoder.configure(inputFormat, null, null, 0)
      decoder.start()

      val samples = ArrayList<Float>()
      val info = MediaCodec.BufferInfo()
      var inputDone = false
      var outputDone = false
      try {
        while (!outputDone) {
          if (!inputDone) {
            val inputIndex = decoder.dequeueInputBuffer(10_000)
            if (inputIndex >= 0) {
              val inputBuffer = decoder.getInputBuffer(inputIndex) ?: error("Decoder input buffer unavailable.")
              inputBuffer.clear()
              val size = extractor.readSampleData(inputBuffer, 0)
              if (size < 0) {
                decoder.queueInputBuffer(inputIndex, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM)
                inputDone = true
              } else {
                decoder.queueInputBuffer(inputIndex, 0, size, extractor.sampleTime.coerceAtLeast(0L), extractor.sampleFlags)
                extractor.advance()
              }
            }
          }

          when (val outputIndex = decoder.dequeueOutputBuffer(info, 10_000)) {
            MediaCodec.INFO_TRY_AGAIN_LATER, MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> Unit
            else -> if (outputIndex >= 0) {
              val outputBuffer = decoder.getOutputBuffer(outputIndex) ?: error("Decoder output buffer unavailable.")
              if (info.size > 0) {
                outputBuffer.position(info.offset)
                outputBuffer.limit(info.offset + info.size)
                while (outputBuffer.remaining() >= 2) {
                  samples.add(outputBuffer.short.toInt() / 32768.0f)
                }
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
        context.contentResolver.openFileDescriptor(Uri.parse(inputPath), "r").use { descriptor ->
          requireNotNull(descriptor) { "Unable to open selected audio file." }
          extractor.setDataSource(descriptor.fileDescriptor)
        }
      }
      File(inputPath).isFile -> extractor.setDataSource(inputPath)
      else -> error("Input audio file was not found.")
    }
  }

  private fun encodeWav(context: Context, samples: FloatArray, sampleRate: Int, channels: Int, outputPath: String): String {
    val file = File(outputPath)
    file.parentFile?.mkdirs()
    val dataBytes = samples.size * 2L
    require(dataBytes <= 0xFFFFFFFFL - 44L) { "Output is too large for WAV." }

    file.outputStream().use { out ->
      val fileOutput = java.io.DataOutputStream(out)
      fun u16(value: Int) {
        fileOutput.write(value and 0xFF)
        fileOutput.write((value ushr 8) and 0xFF)
      }
      fun u32(value: Long) {
        fileOutput.write((value and 0xFF).toInt())
        fileOutput.write(((value ushr 8) and 0xFF).toInt())
        fileOutput.write(((value ushr 16) and 0xFF).toInt())
        fileOutput.write(((value ushr 24) and 0xFF).toInt())
      }
      fileOutput.writeBytes("RIFF")
      u32(dataBytes + 36L)
      fileOutput.writeBytes("WAVE")
      fileOutput.writeBytes("fmt ")
      u32(16)
      u16(1)
      u16(channels)
      u32(sampleRate.toLong())
      u32((sampleRate * channels * 2).toLong())
      u16(channels * 2)
      u16(16)
      fileOutput.writeBytes("data")
      u32(dataBytes)

      for (sample in samples) {
        val pcm = (sample.coerceIn(-1f, 1f) * 32767f).toInt().toShort().toInt()
        u16(pcm)
      }
    }
    return file.absolutePath
  }
}
