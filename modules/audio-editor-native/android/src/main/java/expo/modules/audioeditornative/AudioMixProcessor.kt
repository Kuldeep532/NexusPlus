package expo.modules.audioeditornative

import android.content.Context
import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaFormat
import android.net.Uri
import java.io.File
import java.nio.ByteBuffer
import java.nio.ByteOrder

internal object AudioMixProcessor {
  data class Clip(
    val path: String,
    val startMs: Double,
    val volume: Double,
  )

  fun mix(
    context: Context?,
    basePath: String,
    overlay: Clip,
    outputPath: String,
  ): Map<String, Any?> {
    require(context != null) { "Audio editor context is unavailable." }
    require(basePath.isNotBlank()) { "Base audio path is required." }
    require(overlay.path.isNotBlank()) { "Overlay audio path is required." }
    require(outputPath.isNotBlank()) { "Output audio path is required." }
    require(overlay.startMs.isFinite() && overlay.startMs >= 0.0) { "Overlay start time is invalid." }
    require(overlay.volume.isFinite() && overlay.volume >= 0.0 && overlay.volume <= 2.0) {
      "Overlay volume must be between 0 and 2."
    }

    val base = decodePcm16(context, basePath)
    val overlayAudio = decodePcm16(context, overlay.path)
    require(base.sampleRate == overlayAudio.sampleRate) {
      "Base audio and overlay sample rates must match."
    }
    require(base.channels == overlayAudio.channels) {
      "Base audio and overlay channel counts must match."
    }

    val startFrame = (overlay.startMs * base.sampleRate / 1000.0)
      .toLong()
      .coerceAtLeast(0L)
    val startSampleLong = startFrame * base.channels.toLong()
    val startSample = startSampleLong.coerceAtMost(base.samples.size.toLong()).toInt()
    val mixed = base.samples.copyOf()
    val availableSamples = (mixed.size - startSample).coerceAtLeast(0)
    val mixSamples = minOf(overlayAudio.samples.size, availableSamples)

    for (index in 0 until mixSamples) {
      val baseValue = mixed[startSample + index].toInt()
      val overlayValue = Math.round(overlayAudio.samples[index].toInt() * overlay.volume).toInt()
      mixed[startSample + index] = (baseValue + overlayValue)
        .coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt())
        .toShort()
    }

    writeWav(outputPath, mixed, base.sampleRate, base.channels)
    return mapOf(
      "outputPath" to outputPath,
      "durationMs" to base.durationMs,
      "sampleRate" to base.sampleRate,
      "channels" to base.channels,
      "mimeType" to "audio/wav",
    )
  }

  private data class Pcm(
    val sampleRate: Int,
    val channels: Int,
    val samples: ShortArray,
  ) {
    val durationMs: Double
      get() = samples.size.toDouble() / (sampleRate.toDouble() * channels.toDouble()) * 1000.0
  }

  private fun decodePcm16(context: Context, path: String): Pcm {
    val extractor = MediaExtractor()
    try {
      setDataSource(context, extractor, path)

      var trackIndex = -1
      var format: MediaFormat? = null
      for (index in 0 until extractor.trackCount) {
        val candidate = extractor.getTrackFormat(index)
        val mime = candidate.getString(MediaFormat.KEY_MIME) ?: continue
        if (mime.startsWith("audio/")) {
          trackIndex = index
          format = candidate
          break
        }
      }

      require(trackIndex >= 0 && format != null) { "No supported audio track was found." }
      val audioFormat = requireNotNull(format)
      val mime = audioFormat.getString(MediaFormat.KEY_MIME) ?: error("Audio MIME type is missing.")
      val codec = MediaCodec.createDecoderByType(mime)

      try {
        codec.configure(audioFormat, null, null, 0)
        codec.start()
        extractor.selectTrack(trackIndex)

        val chunks = ArrayList<ShortArray>()
        val info = MediaCodec.BufferInfo()
        var inputEnded = false
        var outputEnded = false

        while (!outputEnded) {
          if (!inputEnded) {
            val inputIndex = codec.dequeueInputBuffer(10_000)
            if (inputIndex >= 0) {
              val inputBuffer = codec.getInputBuffer(inputIndex)
                ?: error("Decoder input buffer unavailable.")
              inputBuffer.clear()
              val size = extractor.readSampleData(inputBuffer, 0)
              if (size < 0) {
                codec.queueInputBuffer(
                  inputIndex,
                  0,
                  0,
                  0,
                  MediaCodec.BUFFER_FLAG_END_OF_STREAM,
                )
                inputEnded = true
              } else {
                val presentationTimeUs = extractor.sampleTime.coerceAtLeast(0L)
                codec.queueInputBuffer(
                  inputIndex,
                  0,
                  size,
                  presentationTimeUs,
                  extractor.sampleFlags,
                )
                extractor.advance()
              }
            }
          }

          when (val outputIndex = codec.dequeueOutputBuffer(info, 10_000)) {
            MediaCodec.INFO_TRY_AGAIN_LATER -> Unit
            MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> Unit
            else -> if (outputIndex >= 0) {
              val outputBuffer = codec.getOutputBuffer(outputIndex)
              if (outputBuffer != null && info.size > 0) {
                outputBuffer.position(info.offset)
                outputBuffer.limit(info.offset + info.size)
                val bytes = ByteArray(info.size)
                outputBuffer.get(bytes)
                val shortCount = bytes.size / 2
                val samples = ShortArray(shortCount)
                val littleEndian = ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN)
                for (index in 0 until shortCount) {
                  samples[index] = littleEndian.short
                }
                chunks.add(samples)
              }
              outputEnded = (info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0
              codec.releaseOutputBuffer(outputIndex, false)
            }
          }
        }

        val totalSamples = chunks.sumOf { it.size }
        val samples = ShortArray(totalSamples)
        var cursor = 0
        for (chunk in chunks) {
          chunk.copyInto(samples, cursor)
          cursor += chunk.size
        }

        val sampleRate = if (audioFormat.containsKey(MediaFormat.KEY_SAMPLE_RATE)) {
          audioFormat.getInteger(MediaFormat.KEY_SAMPLE_RATE)
        } else {
          0
        }
        val channels = if (audioFormat.containsKey(MediaFormat.KEY_CHANNEL_COUNT)) {
          audioFormat.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
        } else {
          0
        }
        require(sampleRate > 0 && channels > 0) {
          "Decoder did not provide valid audio format information."
        }
        require(samples.size % channels == 0) {
          "Decoded audio data is not channel-aligned."
        }

        return Pcm(sampleRate, channels, samples)
      } finally {
        try {
          codec.stop()
        } catch (_: Exception) {
          // Decoder may already be stopped after an output failure.
        }
        codec.release()
      }
    } finally {
      extractor.release()
    }
  }

  private fun setDataSource(context: Context, extractor: MediaExtractor, path: String) {
    when {
      path.startsWith("content://") || path.startsWith("file://") -> {
        val uri = Uri.parse(path)
        context.contentResolver.openFileDescriptor(uri, "r").use { descriptor ->
          requireNotNull(descriptor) { "Unable to open selected overlay audio." }
          extractor.setDataSource(descriptor.fileDescriptor)
        }
      }
      File(path).isFile -> extractor.setDataSource(path)
      else -> throw IllegalArgumentException("Overlay audio file was not found.")
    }
  }

  private fun writeWav(path: String, samples: ShortArray, sampleRate: Int, channels: Int) {
    val file = File(path)
    file.parentFile?.mkdirs()

    file.outputStream().buffered().use { output ->
      fun writeLittleEndian16(value: Int) {
        output.write(value and 0xFF)
        output.write((value ushr 8) and 0xFF)
      }

      fun writeLittleEndian32(value: Int) {
        output.write(value and 0xFF)
        output.write((value ushr 8) and 0xFF)
        output.write((value ushr 16) and 0xFF)
        output.write((value ushr 24) and 0xFF)
      }

      val dataBytes = samples.size.toLong() * 2L
      require(dataBytes <= Int.MAX_VALUE.toLong()) { "Mixed audio is too large to export." }

      output.write("RIFF".toByteArray(Charsets.US_ASCII))
      writeLittleEndian32((36L + dataBytes).toInt())
      output.write("WAVE".toByteArray(Charsets.US_ASCII))
      output.write("fmt ".toByteArray(Charsets.US_ASCII))
      writeLittleEndian32(16)
      writeLittleEndian16(1)
      writeLittleEndian16(channels)
      writeLittleEndian32(sampleRate)
      writeLittleEndian32(sampleRate * channels * 2)
      writeLittleEndian16(channels * 2)
      writeLittleEndian16(16)
      output.write("data".toByteArray(Charsets.US_ASCII))
      writeLittleEndian32(dataBytes.toInt())

      val buffer = ByteArray(8192)
      var offset = 0
      while (offset < samples.size) {
        val count = minOf(buffer.size / 2, samples.size - offset)
        val byteBuffer = ByteBuffer.wrap(buffer).order(ByteOrder.LITTLE_ENDIAN)
        repeat(count) { index ->
          val pcm = samples[offset + index].toInt()
          byteBuffer.putShort(index * 2, pcm.toShort())
        }
        output.write(buffer, 0, count * 2)
        offset += count
      }
    }
  }
}
