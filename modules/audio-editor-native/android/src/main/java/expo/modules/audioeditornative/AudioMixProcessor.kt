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
    effect: Clip,
    outputPath: String,
  ): Map<String, Any?> {
    require(context != null) { "Audio editor context is unavailable." }
    require(effect.startMs >= 0.0 && effect.startMs.isFinite()) { "Effect start time is invalid." }
    require(effect.volume.isFinite() && effect.volume >= 0.0 && effect.volume <= 2.0) { "Effect volume must be between 0 and 2." }
    require(File(outputPath).parentFile?.mkdirs() != false || File(outputPath).parentFile == null) { "Unable to create output folder." }

    val base = decodePcm16(context, basePath)
    val fx = decodePcm16(context, effect.path)
    require(base.sampleRate == fx.sampleRate) { "Base audio and sound effect sample rates must match." }
    require(base.channels == fx.channels) { "Base audio and sound effect channel counts must match." }

    val startFrame = ((effect.startMs / 1000.0) * base.sampleRate).toLong().coerceAtLeast(0L)
    val startSample = (startFrame * base.channels).coerceAtMost(base.samples.size.toLong()).toInt()
    val copy = base.samples.copyOf()
    val mixSamples = minOf(fx.samples.size, copy.size - startSample)
    for (index in 0 until mixSamples) {
      val mixed = copy[startSample + index].toInt() + kotlin.math.round(fx.samples[index].toInt() * effect.volume).toInt()
      copy[startSample + index] = mixed.coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt()).toShort()
    }

    writeWav(outputPath, copy, base.sampleRate, base.channels)
    return mapOf(
      "outputPath" to outputPath,
      "durationMs" to (copy.size.toDouble() / (base.sampleRate * base.channels.toDouble()) * 1000.0),
      "sampleRate" to base.sampleRate,
      "channels" to base.channels,
    )
  }

  private data class Pcm(val sampleRate: Int, val channels: Int, val samples: ShortArray)

  private fun decodePcm16(context: Context, path: String): Pcm {
    val extractor = MediaExtractor()
    try {
      setDataSource(context, extractor, path)
      var track = -1
      var format: MediaFormat? = null
      for (index in 0 until extractor.trackCount) {
        val candidate = extractor.getTrackFormat(index)
        val mime = candidate.getString(MediaFormat.KEY_MIME) ?: continue
        if (mime.startsWith("audio/")) {
          track = index
          format = candidate
          break
        }
      }
      require(track >= 0 && format != null) { "No supported audio track was found." }
      val mime = format.getString(MediaFormat.KEY_MIME) ?: error("Audio MIME type is missing.")
      val codec = MediaCodec.createDecoderByType(mime)
      val inputIndex: MutableList<Int> = mutableListOf()
      val outputIndex: MutableList<Int> = mutableListOf()
      try {
        codec.configure(format, null, null, 0)
        codec.start()
        extractor.selectTrack(track)
        val chunks = ArrayList<ShortArray>()
        val info = MediaCodec.BufferInfo()
        var sawInputEnd = false
        var sawOutputEnd = false
        while (!sawOutputEnd) {
          if (!sawInputEnd) {
            val inIndex = codec.dequeueInputBuffer(10_000)
            if (inIndex >= 0) {
              val input = codec.getInputBuffer(inIndex) ?: error("Decoder input buffer unavailable.")
              input.clear()
              val size = extractor.readSampleData(input, 0)
              if (size < 0) {
                codec.queueInputBuffer(inIndex, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM)
                sawInputEnd = true
              } else {
                codec.queueInputBuffer(inIndex, 0, size, extractor.sampleTime.coerceAtLeast(0), extractor.sampleFlags)
                extractor.advance()
              }
            }
          }

          val outIndex = codec.dequeueOutputBuffer(info, 10_000)
          when {
            outIndex >= 0 -> {
              val output = codec.getOutputBuffer(outIndex)
              if (output != null && info.size > 0) {
                output.position(info.offset)
                output.limit(info.offset + info.size)
                val bytes = ByteArray(info.size)
                output.get(bytes)
                val shortCount = bytes.size / 2
                val shorts = ShortArray(shortCount)
                val buffer = ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN)
                for (i in 0 until shortCount) shorts[i] = buffer.short
                chunks.add(shorts)
              }
              if ((info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) sawOutputEnd = true
              codec.releaseOutputBuffer(outIndex, false)
            }
            outIndex == MediaCodec.INFO_TRY_AGAIN_LATER -> {
              if (sawInputEnd) continue
            }
          }
        }
        val total = chunks.sumOf { it.size }
        val samples = ShortArray(total)
        var cursor = 0
        for (chunk in chunks) {
          chunk.copyInto(samples, cursor)
          cursor += chunk.size
        }
        val rate = if (format.containsKey(MediaFormat.KEY_SAMPLE_RATE)) format.getInteger(MediaFormat.KEY_SAMPLE_RATE) else 0
        val channels = if (format.containsKey(MediaFormat.KEY_CHANNEL_COUNT)) format.getInteger(MediaFormat.KEY_CHANNEL_COUNT) else 0
        require(rate > 0 && channels > 0) { "Decoder did not provide valid audio format information." }
        return Pcm(rate, channels, samples)
      } finally {
        try { codec.stop() } catch (_: Exception) { }
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
          requireNotNull(descriptor) { "Unable to open selected sound effect." }
          extractor.setDataSource(descriptor.fileDescriptor)
        }
      }
      File(path).isFile -> extractor.setDataSource(path)
      else -> throw IllegalArgumentException("Sound effect file was not found.")
    }
  }

  private fun writeWav(path: String, samples: ShortArray, sampleRate: Int, channels: Int) {
    File(path).outputStream().buffered().use { out ->
      fun le16(value: Int) {
        out.write(value and 0xFF)
        out.write((value ushr 8) and 0xFF)
      }
      fun le32(value: Int) {
        out.write(value and 0xFF)
        out.write((value ushr 8) and 0xFF)
        out.write((value ushr 16) and 0xFF)
        out.write((value ushr 24) and 0xFF)
      }
      val dataBytes = samples.size * 2
      out.write("RIFF".toByteArray())
      le32(36 + dataBytes)
      out.write("WAVE".toByteArray())
      out.write("fmt ".toByteArray())
      le32(16)
      le16(1)
      le16(channels)
      le32(sampleRate)
      le32(sampleRate * channels * 2)
      le16(channels * 2)
      le16(16)
      out.write("data".toByteArray())
      le32(dataBytes)
      val buffer = ByteArray(8192)
      var offset = 0
      while (offset < samples.size) {
        val count = minOf(buffer.size / 2, samples.size - offset)
        val bb = ByteBuffer.wrap(buffer).order(ByteOrder.LITTLE_ENDIAN)
        repeat(count) { index -> bb.putShort(index * 2, samples[offset + index]) }
        out.write(buffer, 0, count * 2)
        offset += count
      }
    }
  }
}
