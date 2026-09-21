package expo.modules.audioeditornative

import android.content.Context
import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMuxer
import android.net.Uri
import java.io.File
import java.nio.ByteBuffer

internal object AudioCompressionProcessor {
  fun compress(
    context: Context?,
    inputPath: String,
    outputPath: String,
    bitrateKbps: Int,
    sampleRateHz: Int,
  ): Map<String, Any?> {
    requireNotNull(context) { "Audio editor context is unavailable." }
    require(inputPath.isNotBlank()) { "Input audio path is required." }
    require(outputPath.isNotBlank()) { "Output audio path is required." }
    require(bitrateKbps in 16..320) { "Target bitrate must be between 16 and 320 kbps." }
    require(sampleRateHz in setOf(8000, 12000, 16000, 22050, 24000, 32000, 44100, 48000)) {
      "Target sample rate is not supported."
    }

    val extractor = MediaExtractor()
    var decoder: MediaCodec? = null
    var encoder: MediaCodec? = null
    var muxer: MediaMuxer? = null
    var muxerStarted = false
    var encoderOutputTrack = -1

    val destination = File(outputPath)
    destination.parentFile?.mkdirs()
    if (destination.exists()) require(destination.delete()) { "Unable to replace existing output file." }

    try {
      setDataSource(context, extractor, inputPath)
      var sourceTrack = -1
      var sourceFormat: MediaFormat? = null
      for (index in 0 until extractor.trackCount) {
        val candidate = extractor.getTrackFormat(index)
        val mime = candidate.getString(MediaFormat.KEY_MIME) ?: continue
        if (mime.startsWith("audio/")) {
          sourceTrack = index
          sourceFormat = candidate
          break
        }
      }
      require(sourceTrack >= 0 && sourceFormat != null) { "No supported audio track was found." }
      val inputFormat = requireNotNull(sourceFormat)
      val inputMime = inputFormat.getString(MediaFormat.KEY_MIME)
        ?: throw IllegalArgumentException("Audio codec MIME type is missing.")

      val channels = if (inputFormat.containsKey(MediaFormat.KEY_CHANNEL_COUNT)) {
        inputFormat.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
      } else 2
      require(channels in 1..2) { "This compressor supports mono and stereo audio." }

      val encoderMime = "audio/mp4a-latm"
      val targetBitrate = bitrateKbps * 1000

      decoder = MediaCodec.createDecoderByType(inputMime)
      decoder.configure(inputFormat, null, null, 0)
      decoder.start()

      val encoderFormat = MediaFormat.createAudioFormat(encoderMime, sampleRateHz, channels).apply {
        setInteger(MediaFormat.KEY_AAC_PROFILE, 2)
        setInteger(MediaFormat.KEY_BIT_RATE, targetBitrate)
        setInteger(MediaFormat.KEY_MAX_INPUT_SIZE, 16384)
      }
      encoder = MediaCodec.createEncoderByType(encoderMime)
      encoder.configure(encoderFormat, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
      encoder.start()

      muxer = MediaMuxer(outputPath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
      extractor.selectTrack(sourceTrack)

      val decoderInfo = MediaCodec.BufferInfo()
      val encoderInfo = MediaCodec.BufferInfo()
      var extractorDone = false
      var decoderDone = false
      var encoderDone = false
      var decodedFormatReady = false
      var totalInputPcmBytes = 0L
      var encodedBytes = 0L

      while (!encoderDone) {
        if (!extractorDone) {
          val inputIndex = decoder.dequeueInputBuffer(10_000)
          if (inputIndex >= 0) {
            val inputBuffer = decoder.getInputBuffer(inputIndex) ?: error("Decoder input buffer unavailable.")
            inputBuffer.clear()
            val size = extractor.readSampleData(inputBuffer, 0)
            if (size < 0) {
              decoder.queueInputBuffer(inputIndex, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM)
              extractorDone = true
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

        if (!decoderDone) {
          when (val decodedIndex = decoder.dequeueOutputBuffer(decoderInfo, 10_000)) {
            MediaCodec.INFO_TRY_AGAIN_LATER -> Unit
            MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
              decodedFormatReady = true
            }
            else -> if (decodedIndex >= 0) {
              val outputBuffer = decoder.getOutputBuffer(decodedIndex)
              if (outputBuffer != null && decoderInfo.size > 0) {
                val encoderInputIndex = encoder.dequeueInputBuffer(10_000)
                if (encoderInputIndex >= 0) {
                  val encoderInput = encoder.getInputBuffer(encoderInputIndex)
                    ?: error("Encoder input buffer unavailable.")
                  outputBuffer.position(decoderInfo.offset)
                  outputBuffer.limit(decoderInfo.offset + decoderInfo.size)
                  encoderInput.clear()
                  val writable = minOf(decoderInfo.size, encoderInput.remaining())
                  val pcm = ByteArray(writable)
                  outputBuffer.get(pcm)
                  encoderInput.put(pcm)
                  encoder.queueInputBuffer(
                    encoderInputIndex,
                    0,
                    writable,
                    decoderInfo.presentationTimeUs,
                    if ((decoderInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) MediaCodec.BUFFER_FLAG_END_OF_STREAM else 0,
                  )
                  totalInputPcmBytes += writable.toLong()
                }
              }
              decoder.releaseOutputBuffer(decodedIndex, false)
              if ((decoderInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) decoderDone = true
            }
          }
        } else if (!encoderDone) {
          val encoderInputIndex = encoder.dequeueInputBuffer(10_000)
          if (encoderInputIndex >= 0) {
            encoder.queueInputBuffer(encoderInputIndex, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM)
          }
        }

        when (val encodedIndex = encoder.dequeueOutputBuffer(encoderInfo, 10_000)) {
          MediaCodec.INFO_TRY_AGAIN_LATER -> Unit
          MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
            val format = encoder.outputFormat
            require(format.getString(MediaFormat.KEY_MIME) == encoderMime) {
              "Audio encoder did not produce AAC output."
            }
            encoderOutputTrack = muxer.addTrack(format)
            muxer.start()
            muxerStarted = true
          }
          else -> if (encodedIndex >= 0) {
            val encodedBuffer = encoder.getOutputBuffer(encodedIndex)
            if (encodedBuffer != null && encoderInfo.size > 0 && muxerStarted && encoderInfo.presentationTimeUs >= 0) {
              encodedBuffer.position(encoderInfo.offset)
              encodedBuffer.limit(encoderInfo.offset + encoderInfo.size)
              muxer.writeSampleData(encoderOutputTrack, encodedBuffer, encoderInfo)
              encodedBytes += encoderInfo.size.toLong()
            }
            encoderDone = (encoderInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0
            encoder.releaseOutputBuffer(encodedIndex, false)
          }
        }

        if (!decodedFormatReady && extractorDone && decoderDone) break
      }

      require(muxerStarted) { "Audio encoder did not produce an output track." }

      val inputSizeBytes = resolveInputSizeBytes(context, inputPath)
      val outputSizeBytes = destination.length()
      require(outputSizeBytes > 0L) { "Audio compression did not produce a valid file." }

      return mapOf(
        "outputPath" to outputPath,
        "durationMs" to probeDurationMs(context, inputPath),
        "sampleRate" to sampleRateHz,
        "channels" to channels,
        "mimeType" to "audio/mp4a-latm",
        "bitrateKbps" to bitrateKbps,
        "inputSizeBytes" to inputSizeBytes,
        "outputSizeBytes" to outputSizeBytes,
        "encodedBytes" to encodedBytes,
        "decodedPcmBytes" to totalInputPcmBytes,
      )
    } finally {
      if (muxerStarted) {
        try { muxer?.stop() } catch (_: Exception) { }
      }
      muxer?.release()
      try { decoder?.stop() } catch (_: Exception) { }
      decoder?.release()
      try { encoder?.stop() } catch (_: Exception) { }
      encoder?.release()
      extractor.release()
    }
  }

  private fun resolveInputSizeBytes(context: Context, path: String): Long {
    if (path.startsWith("content://") || path.startsWith("file://")) {
      return try {
        context.contentResolver.openAssetFileDescriptor(Uri.parse(path), "r")?.use { it.length } ?: -1L
      } catch (_: Exception) {
        -1L
      }
    }
    return File(path).takeIf { it.isFile }?.length() ?: -1L
  }

  private fun probeDurationMs(context: Context, path: String): Double {
    val extractor = MediaExtractor()
    return try {
      setDataSource(context, extractor, path)
      for (index in 0 until extractor.trackCount) {
        val format = extractor.getTrackFormat(index)
        val mime = format.getString(MediaFormat.KEY_MIME) ?: continue
        if (mime.startsWith("audio/") && format.containsKey(MediaFormat.KEY_DURATION)) {
          return format.getLong(MediaFormat.KEY_DURATION) / 1000.0
        }
      }
      0.0
    } finally {
      extractor.release()
    }
  }

  private fun setDataSource(context: Context, extractor: MediaExtractor, path: String) {
    when {
      path.startsWith("content://") || path.startsWith("file://") -> {
        context.contentResolver.openFileDescriptor(Uri.parse(path), "r").use { descriptor ->
          requireNotNull(descriptor) { "Unable to open selected audio file." }
          extractor.setDataSource(descriptor.fileDescriptor)
        }
      }
      File(path).isFile -> extractor.setDataSource(path)
      else -> throw IllegalArgumentException("Input audio file was not found.")
    }
  }
}
