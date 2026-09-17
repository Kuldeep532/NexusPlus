package expo.modules.audioeditornative

import android.content.Context
import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMuxer
import android.net.Uri
import java.io.File

/**
 * Safe format conversion using Android's codec stack.
 *
 * Guaranteed targets on the Android implementation:
 * - WAV: PCM 16-bit, written directly.
 * - M4A/AAC: AAC-LC in an MP4 container.
 *
 * Other containers/codecs are rejected explicitly rather than creating a file
 * with a mismatched extension. Those targets should be wired to the app's
 * approved FFmpeg native runtime when that runtime is packaged in the build.
 */
internal object AudioFormatConverterProcessor {
  fun convert(
    context: Context?,
    inputPath: String,
    outputPath: String,
    format: String,
    bitrate: Int,
    sampleRate: Int,
    quality: Int,
  ): Map<String, Any?> {
    require(context != null) { "Audio editor context is unavailable." }
    require(inputPath.isNotBlank()) { "Input audio path is required." }
    require(outputPath.isNotBlank()) { "Output audio path is required." }
    require(bitrate in 8_000..512_000) { "Bitrate must be between 8 kbps and 512 kbps." }
    require(sampleRate in 8_000..192_000) { "Sample rate must be between 8 kHz and 192 kHz." }
    require(quality in 0..10) { "Quality must be between 0 and 10." }

    return when (format.lowercase()) {
      "wav" -> convertToWav(context, inputPath, outputPath)
      "aac", "m4a" -> convertToAac(context, inputPath, outputPath, bitrate, sampleRate)
      "mp3", "flac", "ogg" -> throw UnsupportedOperationException(
        "${format.uppercase()} export requires the approved FFmpeg native runtime; this Android codec path does not provide a guaranteed encoder for that format."
      )
      else -> throw IllegalArgumentException("Unsupported output format: $format.")
    }
  }

  private fun convertToWav(context: Context, inputPath: String, outputPath: String): Map<String, Any?> {
    val decoded = AndroidAudioDecoder(context).decode(inputPath)
    require(decoded.sampleRate > 0 && decoded.channels > 0) { "Decoded audio format is invalid." }
    return PcmWavWriter.write(outputPath, PcmAudio(decoded.sampleRate, decoded.channels, decoded.samples))
      .toMutableMap()
      .apply {
        put("format", "wav")
        put("inputBytes", sourceByteLength(context, inputPath))
        put("outputBytes", File(outputPath).length())
      }
  }

  private fun convertToAac(
    context: Context,
    inputPath: String,
    outputPath: String,
    bitrate: Int,
    sampleRate: Int,
  ): Map<String, Any?> {
    val destination = File(outputPath)
    destination.parentFile?.mkdirs()
    if (destination.exists()) require(destination.delete()) { "Unable to replace existing output file." }

    val extractor = MediaExtractor()
    var decoder: MediaCodec? = null
    var encoder: MediaCodec? = null
    var muxer: MediaMuxer? = null
    var muxerStarted = false
    try {
      setDataSource(context, extractor, inputPath)
      var inputTrack = -1
      var sourceFormat: MediaFormat? = null
      for (index in 0 until extractor.trackCount) {
        val candidate = extractor.getTrackFormat(index)
        val mime = candidate.getString(MediaFormat.KEY_MIME) ?: continue
        if (mime.startsWith("audio/")) {
          inputTrack = index
          sourceFormat = candidate
          break
        }
      }
      require(inputTrack >= 0 && sourceFormat != null) { "No supported audio track was found." }

      val source = sourceFormat
      val inputMime = source.getString(MediaFormat.KEY_MIME) ?: error("Audio MIME type is unavailable.")
      val durationUs = if (source.containsKey(MediaFormat.KEY_DURATION)) source.getLong(MediaFormat.KEY_DURATION) else 0L
      val channels = (if (source.containsKey(MediaFormat.KEY_CHANNEL_COUNT)) source.getInteger(MediaFormat.KEY_CHANNEL_COUNT) else 2).coerceIn(1, 2)
      val encoderMime = "audio/mp4a-latm"
      val encoderFormat = MediaFormat.createAudioFormat(encoderMime, sampleRate, channels)
      encoderFormat.setInteger(MediaFormat.KEY_AAC_PROFILE, MediaCodecInfo.CodecProfileLevel.AACObjectLC)
      encoderFormat.setInteger(MediaFormat.KEY_BIT_RATE, bitrate)
      encoderFormat.setInteger(MediaFormat.KEY_MAX_INPUT_SIZE, 16 * 1024)

      decoder = MediaCodec.createDecoderByType(inputMime)
      decoder.configure(source, null, null, 0)
      decoder.start()
      encoder = MediaCodec.createEncoderByType(encoderMime)
      encoder.configure(encoderFormat, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
      encoder.start()
      muxer = MediaMuxer(outputPath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
      extractor.selectTrack(inputTrack)

      val decodeInfo = MediaCodec.BufferInfo()
      val encodeInfo = MediaCodec.BufferInfo()
      var extractorDone = false
      var decoderDone = false
      var encoderEosQueued = false
      var encoderDone = false
      var encoderTrack = -1
      var sawOutput = false
      val timeoutUs = 10_000L

      while (!encoderDone) {
        if (!extractorDone) {
          val inputIndex = decoder.dequeueInputBuffer(timeoutUs)
          if (inputIndex >= 0) {
            val inputBuffer = decoder.getInputBuffer(inputIndex) ?: error("Decoder input buffer unavailable.")
            inputBuffer.clear()
            val size = extractor.readSampleData(inputBuffer, 0)
            if (size < 0) {
              decoder.queueInputBuffer(inputIndex, 0, 0, 0L, MediaCodec.BUFFER_FLAG_END_OF_STREAM)
              extractorDone = true
            } else {
              decoder.queueInputBuffer(inputIndex, 0, size, extractor.sampleTime.coerceAtLeast(0L), extractor.sampleFlags)
              extractor.advance()
            }
          }
        }

        while (!decoderDone) {
          val outputIndex = decoder.dequeueOutputBuffer(decodeInfo, timeoutUs)
          if (outputIndex == MediaCodec.INFO_TRY_AGAIN_LATER) break
          if (outputIndex == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) continue
          if (outputIndex < 0) continue
          val pcm = decoder.getOutputBuffer(outputIndex)
          if (pcm != null && decodeInfo.size > 0) {
            pcm.position(decodeInfo.offset)
            pcm.limit(decodeInfo.offset + decodeInfo.size)
            val chunk = ByteArray(decodeInfo.size)
            pcm.get(chunk)
            var offset = 0
            while (offset < chunk.size) {
              val inputIndex = encoder.dequeueInputBuffer(timeoutUs)
              if (inputIndex < 0) continue
              val encoderInput = encoder.getInputBuffer(inputIndex) ?: error("Encoder input buffer unavailable.")
              encoderInput.clear()
              val count = minOf(chunk.size - offset, encoderInput.remaining())
              encoderInput.put(chunk, offset, count)
              encoder.queueInputBuffer(inputIndex, 0, count, decodeInfo.presentationTimeUs, 0)
              offset += count
            }
          }
          if ((decodeInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) decoderDone = true
          decoder.releaseOutputBuffer(outputIndex, false)
        }

        if (decoderDone && !encoderEosQueued) {
          val inputIndex = encoder.dequeueInputBuffer(timeoutUs)
          if (inputIndex >= 0) {
            encoder.queueInputBuffer(inputIndex, 0, 0, durationUs.coerceAtLeast(0L), MediaCodec.BUFFER_FLAG_END_OF_STREAM)
            encoderEosQueued = true
          }
        }

        while (!encoderDone) {
          val outputIndex = encoder.dequeueOutputBuffer(encodeInfo, timeoutUs)
          if (outputIndex == MediaCodec.INFO_TRY_AGAIN_LATER) break
          if (outputIndex == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
            encoderTrack = muxer.addTrack(encoder.outputFormat)
            muxer.start()
            muxerStarted = true
            continue
          }
          if (outputIndex < 0) continue
          val encoded = encoder.getOutputBuffer(outputIndex)
          val codecConfig = (encodeInfo.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG) != 0
          if (encoded != null && encodeInfo.size > 0 && !codecConfig) {
            require(muxerStarted && encoderTrack >= 0) { "AAC encoder did not produce a writable output format." }
            encoded.position(encodeInfo.offset)
            encoded.limit(encodeInfo.offset + encodeInfo.size)
            muxer.writeSampleData(encoderTrack, encoded, encodeInfo)
            sawOutput = true
          }
          if ((encodeInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) encoderDone = true
          encoder.releaseOutputBuffer(outputIndex, false)
        }
      }

      require(sawOutput) { "The selected audio could not be converted to AAC." }
      return mapOf(
        "outputPath" to destination.absolutePath,
        "format" to "${if (outputPath.lowercase().endsWith(".aac")) "aac" else "m4a"}",
        "durationMs" to durationUs / 1000.0,
        "sampleRate" to sampleRate,
        "channels" to channels,
        "mimeType" to if (outputPath.lowercase().endsWith(".aac")) "audio/aac" else "audio/mp4",
        "inputBytes" to sourceByteLength(context, inputPath),
        "outputBytes" to destination.length(),
        "bitrate" to bitrate,
      )
    } finally {
      try { decoder?.stop() } catch (_: Exception) { }
      try { decoder?.release() } catch (_: Exception) { }
      try { encoder?.stop() } catch (_: Exception) { }
      try { encoder?.release() } catch (_: Exception) { }
      if (muxerStarted) try { muxer?.stop() } catch (_: Exception) { }
      muxer?.release()
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
      else -> throw IllegalArgumentException("Input audio file was not found.")
    }
  }

  private fun sourceByteLength(context: Context, inputPath: String): Long? {
    val directFile = File(inputPath)
    if (directFile.isFile) return directFile.length()
    return try {
      if (inputPath.startsWith("content://") || inputPath.startsWith("file://")) {
        context.contentResolver.openAssetFileDescriptor(Uri.parse(inputPath), "r")?.use { it.length.takeIf { size -> size >= 0 } }
      } else null
    } catch (_: Exception) {
      null
    }
  }
}
