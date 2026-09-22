package expo.modules.audioeditornative

import android.content.Context
import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaFormat
import android.net.Uri
import java.io.File
import java.io.RandomAccessFile
import kotlin.math.PI
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
    outputStem: String,
    quality: String,
    preserveBass: Boolean,
    preserveStereo: Boolean,
  ): Result {
    val extractor = MediaExtractor()
    var decoder: MediaCodec? = null
    val output = File(outputPath)
    output.parentFile?.mkdirs()
    if (output.exists()) require(output.delete()) { "Unable to replace existing vocal-removal output." }

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

      val inputFormat = requireNotNull(format)
      val mime = inputFormat.getString(MediaFormat.KEY_MIME)
        ?: error("Audio codec MIME type is missing.")
      val sampleRate = inputFormat.getInteger(MediaFormat.KEY_SAMPLE_RATE)
      val channels = inputFormat.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
      require(sampleRate > 0 && channels > 0) { "Audio format has invalid sample rate or channel count." }
      require(channels == 2) {
        "Vocal removal needs a stereo audio source. Mono files cannot be separated reliably."
      }

      val durationUs = if (inputFormat.containsKey(MediaFormat.KEY_DURATION)) {
        inputFormat.getLong(MediaFormat.KEY_DURATION)
      } else 0L

      extractor.selectTrack(audioTrack)
      decoder = MediaCodec.createDecoderByType(mime)
      decoder.configure(inputFormat, null, null, 0)
      decoder.start()

      val bassCutoff = when (quality) {
        "preview" -> 220.0
        "studio" -> 140.0
        else -> 180.0
      }
      val bassAlpha = min(1.0, (2.0 * PI * bassCutoff / sampleRate).coerceAtLeast(0.0001)).toFloat()
      val bassGain = if (preserveBass) 0.28f else 0.0f
      var bassState = 0f

      RandomAccessFile(output, "rw").use { file ->
        writeWavHeader(file, sampleRate, channels, 0L)

        val info = MediaCodec.BufferInfo()
        var inputDone = false
        var outputDone = false
        var pcmBytesWritten = 0L

        while (!outputDone) {
          if (!inputDone) {
            val inputIndex = decoder.dequeueInputBuffer(10_000)
            if (inputIndex >= 0) {
              val inputBuffer = decoder.getInputBuffer(inputIndex)
                ?: error("Decoder input buffer unavailable.")
              inputBuffer.clear()
              val size = extractor.readSampleData(inputBuffer, 0)
              if (size < 0) {
                decoder.queueInputBuffer(
                  inputIndex,
                  0,
                  0,
                  0L,
                  MediaCodec.BUFFER_FLAG_END_OF_STREAM,
                )
                inputDone = true
              } else {
                decoder.queueInputBuffer(
                  inputIndex,
                  0,
                  size,
                  extractor.sampleTime.coerceAtLeast(0L),
                  extractor.sampleFlags,
                )
                extractor.advance()
              }
            }
          }

          when (val outputIndex = decoder.dequeueOutputBuffer(info, 10_000)) {
            MediaCodec.INFO_TRY_AGAIN_LATER,
            MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> Unit

            else -> if (outputIndex >= 0) {
              val outputBuffer = decoder.getOutputBuffer(outputIndex)
                ?: error("Decoder output buffer unavailable.")

              if (info.size > 0) {
                outputBuffer.position(info.offset)
                outputBuffer.limit(info.offset + info.size)

                val frameBytes = channels * 2
                val usableBytes = info.size - (info.size % frameBytes)
                var byteOffset = 0
                while (byteOffset < usableBytes) {
                  val left = outputBuffer.getShort(byteOffset).toInt() / 32768.0f
                  val right = outputBuffer.getShort(byteOffset + 2).toInt() / 32768.0f
                  val mid = 0.5f * (left + right)
                  val side = 0.5f * (left - right)

                  val instrumentalLeft: Float
                  val instrumentalRight: Float

                  if (outputStem == "vocals") {
                    instrumentalLeft = mid
                    instrumentalRight = mid
                  } else {
                    bassState += bassAlpha * (mid - bassState)
                    val centerBass = bassGain * bassState
                    instrumentalLeft = side + centerBass
                    instrumentalRight = if (preserveStereo) {
                      -side + centerBass
                    } else {
                      instrumentalLeft
                    }
                  }

                  file.writeShortLE(toPcm16(instrumentalLeft))
                  file.writeShortLE(toPcm16(instrumentalRight))
                  pcmBytesWritten += 4
                  byteOffset += frameBytes
                }
              }

              decoder.releaseOutputBuffer(outputIndex, false)
              if ((info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) {
                outputDone = true
              }
            }
          }
        }

        require(pcmBytesWritten > 0L) { "The selected audio contains no decodable samples." }
        require(pcmBytesWritten <= 0xFFFFFFFFL) { "Output is too large for WAV format." }

        val finalDurationMs =
          if (durationUs > 0L) durationUs / 1000.0
          else (pcmBytesWritten / (channels * 2L)).toDouble() / sampleRate * 1000.0

        writeWavHeader(file, sampleRate, channels, pcmBytesWritten)
        return Result(
          output.absolutePath,
          finalDurationMs,
          sampleRate,
          channels,
          "audio/wav",
        )
      }
    } finally {
      runCatching { decoder?.stop() }
      decoder?.release()
      extractor.release()
    }
  }

  private fun toPcm16(sample: Float): Int {
    return (sample.coerceIn(-1f, 1f) * 32767f).toInt()
  }

  private fun writeWavHeader(
    file: RandomAccessFile,
    sampleRate: Int,
    channels: Int,
    dataBytes: Long,
  ) {
    file.seek(0L)
    file.writeBytes("RIFF")
    file.writeUInt32LE(36L + dataBytes)
    file.writeBytes("WAVE")
    file.writeBytes("fmt ")
    file.writeUInt32LE(16L)
    file.writeUInt16LE(1)
    file.writeUInt16LE(channels)
    file.writeUInt32LE(sampleRate.toLong())
    file.writeUInt32LE((sampleRate * channels * 2).toLong())
    file.writeUInt16LE(channels * 2)
    file.writeUInt16LE(16)
    file.writeBytes("data")
    file.writeUInt32LE(dataBytes)
  }

  private fun RandomAccessFile.writeShortLE(value: Int) {
    writeUInt16LE(value)
  }

  private fun RandomAccessFile.writeUInt16LE(value: Int) {
    write(value and 0xFF)
    write((value ushr 8) and 0xFF)
  }

  private fun RandomAccessFile.writeUInt32LE(value: Long) {
    write((value and 0xFF).toInt())
    write(((value ushr 8) and 0xFF).toInt())
    write(((value ushr 16) and 0xFF).toInt())
    write(((value ushr 24) and 0xFF).toInt())
  }

  private fun setDataSource(
    context: Context,
    extractor: MediaExtractor,
    inputPath: String,
  ) {
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
}
