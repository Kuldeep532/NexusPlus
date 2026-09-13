package expo.modules.audioeditornative

import java.io.File
import java.io.FileOutputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import kotlin.math.roundToInt

internal object PcmWavWriter {
  fun write(outputPath: String, audio: PcmAudio): Map<String, Any?> {
    val output = File(outputPath)
    output.parentFile?.mkdirs()
    val dataSize = audio.samples.size.toLong() * 2L
    require(dataSize <= Int.MAX_VALUE.toLong()) { "PCM output is too large for a WAV file." }

    FileOutputStream(output).use { stream ->
      val header = ByteBuffer.allocate(44).order(ByteOrder.LITTLE_ENDIAN)
      header.put("RIFF".toByteArray(Charsets.US_ASCII))
      header.putInt((36L + dataSize).toInt())
      header.put("WAVE".toByteArray(Charsets.US_ASCII))
      header.put("fmt ".toByteArray(Charsets.US_ASCII))
      header.putInt(16)
      header.putShort(1)
      header.putShort(audio.channels.toShort())
      header.putInt(audio.sampleRate)
      header.putInt(audio.sampleRate * audio.channels * 2)
      header.putShort((audio.channels * 2).toShort())
      header.putShort(16)
      header.put("data".toByteArray(Charsets.US_ASCII))
      header.putInt(dataSize.toInt())
      stream.write(header.array())

      val pcm = ByteBuffer.allocate(minOf(64 * 1024, maxOf(2, dataSize.toInt()))).order(ByteOrder.LITTLE_ENDIAN)
      for (sample in audio.samples) {
        if (pcm.remaining() < 2) {
          stream.write(pcm.array(), 0, pcm.position())
          pcm.clear()
        }
        val value = (sample.coerceIn(-1f, 1f) * 32767f).roundToInt().coerceIn(-32768, 32767)
        pcm.putShort(value.toShort())
      }
      if (pcm.position() > 0) stream.write(pcm.array(), 0, pcm.position())
    }

    return mapOf(
      "outputPath" to output.absolutePath,
      "mimeType" to "audio/wav",
      "durationMs" to audio.durationMs,
      "sampleRate" to audio.sampleRate,
      "channels" to audio.channels,
    )
  }
}
