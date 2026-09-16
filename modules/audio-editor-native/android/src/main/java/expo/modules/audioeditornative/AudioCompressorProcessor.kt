package expo.modules.audioeditornative

import android.content.Context
import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMuxer
import android.net.Uri
import java.io.File

internal object AudioCompressorProcessor {
  fun compress(
    context: Context?,
    inputPath: String,
    outputPath: String,
    bitrate: Int,
    sampleRate: Int,
  ): Map<String, Any?> {
    require(context != null) { "Audio editor context is unavailable." }
    require(bitrate in 8_000..512_000) { "Bitrate must be between 8 kbps and 512 kbps." }
    require(sampleRate in 8_000..96_000) { "Sample rate must be between 8 kHz and 96 kHz." }

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

      val inputDurationUs = if (sourceFormat.containsKey(MediaFormat.KEY_DURATION)) sourceFormat.getLong(MediaFormat.KEY_DURATION) else 0L
      val channels = (if (sourceFormat.containsKey(MediaFormat.KEY_CHANNEL_COUNT)) sourceFormat.getInteger(MediaFormat.KEY_CHANNEL_COUNT) else 2).coerceIn(1, 2)
      val inputMime = sourceFormat.getString(MediaFormat.KEY_MIME) ?: error("Audio MIME type is unavailable.")
      val encoderMime = "audio/mp4a-latm"
      val encoderFormat = MediaFormat.createAudioFormat(encoderMime, sampleRate, channels)
      encoderFormat.setInteger(MediaFormat.KEY_AAC_PROFILE, MediaCodecInfo.CodecProfileLevel.AACObjectLC)
      encoderFormat.setInteger(MediaFormat.KEY_BIT_RATE, bitrate)
      encoderFormat.setInteger(MediaFormat.KEY_MAX_INPUT_SIZE, 16384)

      decoder = MediaCodec.createDecoderByType(inputMime)
      decoder.configure(sourceFormat, null, null, 0)
      decoder.start()

      encoder = MediaCodec.createEncoderByType(encoderMime)
      encoder.configure(encoderFormat, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
      encoder.start()

      muxer = MediaMuxer(outputPath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
      extractor.selectTrack(inputTrack)

      val decodeInfo = MediaCodec.BufferInfo()
      val encodeInfo = MediaCodec.BufferInfo()
      var encoderTrack = -1
      var extractorDone = false
      var decoderDone = false
      var encoderEosQueued = false
      var encoderDone = false
      var sawOutput = false
      val timeoutUs = 10_000L

      while (!encoderDone) {
        if (!extractorDone) {
          val inputIndex = decoder.dequeueInputBuffer(timeoutUs)
          if (inputIndex >= 0) {
            val buffer = decoder.getInputBuffer(inputIndex) ?: error("Decoder input buffer unavailable.")
            buffer.clear()
            val size = extractor.readSampleData(buffer, 0)
            if (size < 0) {
              decoder.queueInputBuffer(inputIndex, 0, 0, 0L, MediaCodec.BUFFER_FLAG_END_OF_STREAM)
              extractorDone = true
            } else {
              decoder.queueInputBuffer(inputIndex, 0, size, extractor.sampleTime.coerceAtLeast(0L), extractor.sampleFlags)
              extractor.advance()
            }
          }
        }

        var gotDecoderOutput = false
        while (!decoderDone) {
          val outputIndex = decoder.dequeueOutputBuffer(decodeInfo, timeoutUs)
          if (outputIndex == MediaCodec.INFO_TRY_AGAIN_LATER) break
          if (outputIndex == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) continue
          if (outputIndex < 0) continue
          gotDecoderOutput = true
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
              val bytesToCopy = minOf(chunk.size - offset, encoderInput.remaining())
              encoderInput.put(chunk, offset, bytesToCopy)
              encoder.queueInputBuffer(inputIndex, 0, bytesToCopy, decodeInfo.presentationTimeUs, 0)
              offset += bytesToCopy
            }
          }
          if ((decodeInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) {
            decoderDone = true
          }
          decoder.releaseOutputBuffer(outputIndex, false)
        }

        if (decoderDone && !encoderEosQueued) {
          val inputIndex = encoder.dequeueInputBuffer(timeoutUs)
          if (inputIndex >= 0) {
            encoder.queueInputBuffer(inputIndex, 0, 0, inputDurationUs.coerceAtLeast(0L), MediaCodec.BUFFER_FLAG_END_OF_STREAM)
            encoderEosQueued = true
          }
        }

        while (!encoderDone) {
          val outputIndex = encoder.dequeueOutputBuffer(encodeInfo, timeoutUs)
          if (outputIndex == MediaCodec.INFO_TRY_AGAIN_LATER) break
          if (outputIndex == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
            require(encoderTrack < 0) { "Encoder output format changed more than once." }
            encoderTrack = muxer.addTrack(encoder.outputFormat)
            muxer.start()
            muxerStarted = true
            continue
          }
          if (outputIndex < 0) continue

          val encoded = encoder.getOutputBuffer(outputIndex)
          val codecConfig = (encodeInfo.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG) != 0
          if (encodeInfo.size > 0 && encoded != null && !codecConfig) {
            require(muxerStarted && encoderTrack >= 0) { "Audio encoder did not produce a writable output format." }
            encoded.position(encodeInfo.offset)
            encoded.limit(encodeInfo.offset + encodeInfo.size)
            muxer.writeSampleData(encoderTrack, encoded, encodeInfo)
            sawOutput = true
          }
          if ((encodeInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) encoderDone = true
          encoder.releaseOutputBuffer(outputIndex, false)
        }

        if (extractorDone && !gotDecoderOutput && !decoderDone) {
          // Give the decoder another cycle for EOS on slow codecs.
          continue
        }
      }

      require(sawOutput) { "The selected audio could not be compressed." }
      return mapOf(
        "outputPath" to outputPath,
        "durationMs" to inputDurationUs / 1000.0,
        "sampleRate" to sampleRate,
        "channels" to channels,
        "bitrate" to bitrate,
        "mimeType" to "audio/mp4",
        "inputBytes" to sourceByteLength(context, inputPath),
        "outputBytes" to destination.length(),
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
        val uri = Uri.parse(inputPath)
        context.contentResolver.openFileDescriptor(uri, "r").use { descriptor ->
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
    if (inputPath.startsWith("content://") || inputPath.startsWith("file://")) {
      return try {
        context.contentResolver.openAssetFileDescriptor(Uri.parse(inputPath), "r")?.use { it.length.takeIf { size -> size >= 0 } }
      } catch (_: Exception) {
        null
      }
    }
    return null
  }
}
