package expo.modules.audioeditornative

import android.content.Context
import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaFormat
import android.net.Uri
import expo.modules.audioeditornative.shared.AudioDecoderBackend
import expo.modules.audioeditornative.shared.DecodedAudio
import java.io.File
import java.nio.ByteBuffer

internal class AndroidAudioDecoder(private val context: Context) : AudioDecoderBackend {
  override fun supports(mimeType: String?): Boolean = mimeType?.startsWith("audio/") == true

  override fun decode(inputPath: String): DecodedAudio {
    val extractor = MediaExtractor()
    try {
      setDataSource(extractor, inputPath)
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

      val mime = format.getString(MediaFormat.KEY_MIME)
        ?: throw IllegalArgumentException("Audio codec MIME type is missing.")
      val sampleRate = format.getInteger(MediaFormat.KEY_SAMPLE_RATE)
      val channels = format.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
      require(sampleRate > 0 && channels > 0) { "Audio format has invalid sample rate or channel count." }

      extractor.selectTrack(audioTrack)
      val decoder = MediaCodec.createDecoderByType(mime)
      decoder.configure(format, null, null, 0)
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
              val inputBuffer = decoder.getInputBuffer(inputIndex) ?: throw IllegalStateException("Decoder input buffer unavailable.")
              inputBuffer.clear()
              val size = extractor.readSampleData(inputBuffer, 0)
              if (size < 0) {
                decoder.queueInputBuffer(inputIndex, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM)
                inputDone = true
              } else {
                decoder.queueInputBuffer(inputIndex, 0, size, extractor.sampleTime.coerceAtLeast(0), extractor.sampleFlags)
                extractor.advance()
              }
            }
          }

          when (val outputIndex = decoder.dequeueOutputBuffer(info, 10_000)) {
            MediaCodec.INFO_TRY_AGAIN_LATER -> Unit
            MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> Unit
            else -> if (outputIndex >= 0) {
              val outputBuffer = decoder.getOutputBuffer(outputIndex)
                ?: throw IllegalStateException("Decoder output buffer unavailable.")
              if (info.size > 0) {
                outputBuffer.position(info.offset)
                outputBuffer.limit(info.offset + info.size)
                appendPcm(outputBuffer, samples)
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

      return DecodedAudio(sampleRate, channels, samples.toFloatArray())
    } finally {
      extractor.release()
    }
  }

  private fun appendPcm(buffer: ByteBuffer, samples: MutableList<Float>) {
    while (buffer.remaining() >= 2) {
      samples.add(buffer.short.toInt() / 32768.0f)
    }
  }

  private fun setDataSource(extractor: MediaExtractor, inputPath: String) {
    when {
      inputPath.startsWith("content://") || inputPath.startsWith("file://") -> {
        val descriptor = context.contentResolver.openFileDescriptor(Uri.parse(inputPath), "r")
        requireNotNull(descriptor) { "Unable to open selected audio file." }
        descriptor.use { extractor.setDataSource(it.fileDescriptor) }
      }
      File(inputPath).isFile -> extractor.setDataSource(inputPath)
      else -> throw IllegalArgumentException("Input audio file was not found.")
    }
  }
}
