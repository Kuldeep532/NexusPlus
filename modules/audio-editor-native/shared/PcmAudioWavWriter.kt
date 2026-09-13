package expo.modules.audioeditornative.shared

import java.io.DataOutputStream
import java.io.File
import java.io.FileOutputStream

object PcmAudioWavWriter {
  fun write(path: String, audio: PcmAudioBuffer) {
    val file = File(path)
    file.parentFile?.mkdirs()
    DataOutputStream(FileOutputStream(file)).use { out ->
      val dataBytes = audio.samples.size * 2
      val byteRate = audio.sampleRate * audio.channels * 2
      val blockAlign = audio.channels * 2
      out.writeBytes("RIFF")
      writeLeInt(out, 36 + dataBytes)
      out.writeBytes("WAVE")
      out.writeBytes("fmt ")
      writeLeInt(out, 16)
      writeLeShort(out, 1)
      writeLeShort(out, audio.channels)
      writeLeInt(out, audio.sampleRate)
      writeLeInt(out, byteRate)
      writeLeShort(out, blockAlign)
      writeLeShort(out, 16)
      out.writeBytes("data")
      writeLeInt(out, dataBytes)
      audio.samples.forEach { sample ->
        val pcm = (sample.coerceIn(-1.0f, 1.0f) * 32767.0f).toInt()
        writeLeShort(out, pcm)
      }
    }
  }

  private fun writeLeInt(out: DataOutputStream, value: Int) {
    out.writeByte(value and 0xff)
    out.writeByte(value ushr 8 and 0xff)
    out.writeByte(value ushr 16 and 0xff)
    out.writeByte(value ushr 24 and 0xff)
  }

  private fun writeLeShort(out: DataOutputStream, value: Int) {
    out.writeByte(value and 0xff)
    out.writeByte(value ushr 8 and 0xff)
  }
}
