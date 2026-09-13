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
  ): Map<String, Any?> = mixProject(context, basePath, listOf(overlay), outputPath)

  fun mixProject(
    context: Context?,
    basePath: String,
    overlays: List<Clip>,
    outputPath: String,
  ): Map<String, Any?> {
    requireNotNull(context) { "Audio editor context is unavailable." }
    require(basePath.isNotBlank()) { "Base audio path is required." }
    require(outputPath.isNotBlank()) { "Output audio path is required." }
    require(overlays.isNotEmpty()) { "At least one overlay audio track is required." }

    val base = decodePcm16(context, basePath)
    var outputFrames = base.samples.size / base.channels
    val decodedOverlays = ArrayList<Pair<Clip, Pcm>>()

    for ((index, overlay) in overlays.withIndex()) {
      require(overlay.path.isNotBlank()) { "Audio track ${index + 1} path is required." }
      require(overlay.startMs.isFinite() && overlay.startMs >= 0.0) { "Audio track ${index + 1} start time is invalid." }
      require(overlay.volume.isFinite() && overlay.volume >= 0.0 && overlay.volume <= 2.0) {
        "Audio track ${index + 1} volume must be between 0 and 2."
      }

      val decoded = decodePcm16(context, overlay.path)
      require(base.sampleRate == decoded.sampleRate) {
        "Audio track ${index + 1} sample rate does not match the base audio."
      }
      require(base.channels == decoded.channels) {
        "Audio track ${index + 1} channel count does not match the base audio."
      }

      val startFrame = (overlay.startMs * base.sampleRate / 1000.0).toLong().coerceAtLeast(0L)
      val endFrame = startFrame + decoded.samples.size.toLong() / base.channels
      require(endFrame <= Int.MAX_VALUE / base.channels.toLong()) {
        "The mixed audio project is too large to fit in memory."
      }
      outputFrames = maxOf(outputFrames, endFrame.toInt())
      decodedOverlays += overlay to decoded
    }

    val mixed = ShortArray(outputFrames * base.channels)
    base.samples.copyInto(mixed)

    for ((clip, audio) in decodedOverlays) {
      val startFrame = (clip.startMs * base.sampleRate / 1000.0).toLong().coerceAtLeast(0L).toInt()
      val startSample = startFrame * base.channels
      for (sampleIndex in audio.samples.indices) {
        val destinationIndex = startSample + sampleIndex
        if (destinationIndex >= mixed.size) break
        val baseValue = mixed[destinationIndex].toInt()
        val overlayValue = Math.round(audio.samples[sampleIndex].toInt() * clip.volume).toInt()
        mixed[destinationIndex] = (baseValue + overlayValue)
          .coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt())
          .toShort()
      }
    }

    writeWav(outputPath, mixed, base.sampleRate, base.channels)
    return mapOf(
      "outputPath" to outputPath,
      "durationMs" to (outputFrames * 1000.0 / base.sampleRate),
      "sampleRate" to base.sampleRate,
      "channels" to base.channels,
      "mimeType" to "audio/wav",
    )
  }

  private data class Pcm(
    val sampleRate: Int,
    val channels: Int,
    val samples: ShortArray,
  )

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
              val inputBuffer = codec.getInputBuffer(inputIndex) ?: error("Decoder input buffer unavailable.")
              inputBuffer.clear()
              val size = extractor.readSampleData(inputBuffer, 0)
              if (size < 0) {
                codec.queueInputBuffer(inputIndex, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM)
                inputEnded = true
              } else {
                codec.queueInputBuffer(inputIndex, 0, size, extractor.sampleTime.coerceAtLeast(0L), extractor.sampleFlags)
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
                val sampleCount = bytes.size / 2
                val samples = ShortArray(sampleCount)
                val littleEndian = ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN)
                for (index in 0 until sampleCount) samples[index] = littleEndian.short
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

        val sampleRate = if (audioFormat.containsKey(MediaFormat.KEY_SAMPLE_RATE)) audioFormat.getInteger(MediaFormat.KEY_SAMPLE_RATE) else 0
        val channels = if (audioFormat.containsKey(MediaFormat.KEY_CHANNEL_COUNT)) audioFormat.getInteger(MediaFormat.KEY_CHANNEL_COUNT) else 0
        require(sampleRate > 0 && channels > 0) { "Decoder did not provide valid audio format information." }
        require(samples.size % channels == 0) { "Decoded audio data is not channel-aligned." }
        return Pcm(sampleRate, channels, samples)
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
          requireNotNull(descriptor) { "Unable to open selected audio." }
          extractor.setDataSource(descriptor.fileDescriptor)
        }
      }
      File(path).isFile -> extractor.setDataSource(path)
      else -> throw IllegalArgumentException("Audio file was not found.")
    }
  }

  private fun writeWav(path: String, samples: ShortArray, sampleRate: Int, channels: Int) {
    val file = File(path)
    file.parentFile?.mkdirs()
    file.outputStream().buffered().use { output ->
      fun writeLe16(value: Int) {
        output.write(value and 0xFF)
        output.write((value ushr 8) and 0xFF)
      }
      fun writeLe32(value: Int) {
        output.write(value and 0xFF)
        output.write((value ushr 8) and 0xFF)
        output.write((value ushr 16) and 0xFF)
        output.write((value ushr 24) and 0xFF)
      }

      val dataBytes = samples.size.toLong() * 2L
      require(dataBytes <= Int.MAX_VALUE.toLong()) { "Mixed audio is too large to export." }
      output.write("RIFF".toByteArray(Charsets.US_ASCII))
      writeLe32((36L + dataBytes).toInt())
      output.write("WAVE".toByteArray(Charsets.US_ASCII))
      output.write("fmt ".toByteArray(Charsets.US_ASCII))
      writeLe32(16)
      writeLe16(1)
      writeLe16(channels)
      writeLe32(sampleRate)
      writeLe32(sampleRate * channels * 2)
      writeLe16(channels * 2)
      writeLe16(16)
      output.write("data".toByteArray(Charsets.US_ASCII))
      writeLe32(dataBytes.toInt())

      val buffer = ByteArray(8192)
      var offset = 0
      while (offset < samples.size) {
        val count = minOf(buffer.size / 2, samples.size - offset)
        val byteBuffer = ByteBuffer.wrap(buffer).order(ByteOrder.LITTLE_ENDIAN)
        repeat(count) { index -> byteBuffer.putShort(index * 2, samples[offset + index]) }
        output.write(buffer, 0, count * 2)
        offset += count
      }
    }
  }
}
