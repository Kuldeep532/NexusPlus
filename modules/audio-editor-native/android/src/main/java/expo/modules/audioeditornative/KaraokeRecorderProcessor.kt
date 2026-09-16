package expo.modules.audioeditornative

import android.content.Context
import android.media.AudioDeviceInfo
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioRecord
import android.media.MediaCodec
import android.media.MediaFormat
import android.media.MediaMuxer
import android.media.MediaRecorder
import java.io.File
import java.nio.ByteBuffer
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

internal object KaraokeRecorderProcessor {
  private var active: Session? = null

  data class Result(
    val outputPath: String,
    val durationMs: Double,
    val sampleRate: Int,
    val channels: Int,
    val mimeType: String,
    val recordingStartedWithTrack: Boolean,
    val headphoneModeApplied: Boolean,
    val processing: List<String>,
  )

  private class Session(
    val context: Context,
    val karaokeUri: String,
    val outputPath: String,
    val sampleRate: Int,
    val channels: Int,
    val headphoneMode: Boolean,
    val highQuality: Boolean,
  ) {
    val running = AtomicBoolean(true)
    val samples = ArrayList<Short>()
    var recorder: AudioRecord? = null
    var thread: Thread? = null
    var startNs: Long = 0L
  }

  @Synchronized
  fun start(context: Context, karaokeUri: String, outputPath: String, highQuality: Boolean, headphoneMode: Boolean, sampleRate: Int, channels: Int) {
    check(active == null) { "A karaoke recording is already active." }
    require(karaokeUri.isNotBlank()) { "Karaoke track is required." }
    require(outputPath.isNotBlank()) { "Recording output path is required." }
    val safeRate = if (highQuality) 48_000 else sampleRate.coerceIn(16_000, 48_000)
    val safeChannels = channels.coerceIn(1, 2)
    val session = Session(context, karaokeUri, outputPath, safeRate, safeChannels, headphoneMode, highQuality)
    val channelMask = if (safeChannels == 2) AudioFormat.CHANNEL_IN_STEREO else AudioFormat.CHANNEL_IN_MONO
    val minBuffer = AudioRecord.getMinBufferSize(safeRate, channelMask, AudioFormat.ENCODING_PCM_16BIT)
    require(minBuffer > 0) { "This device does not support PCM microphone recording at the requested quality." }
    val bufferSize = max(minBuffer * 2, safeRate / 5 * safeChannels * 2)
    val audioSource = when {
      headphoneMode -> MediaRecorder.AudioSource.VOICE_PERFORMANCE
      else -> MediaRecorder.AudioSource.MIC
    }
    val recorder = try {
      AudioRecord.Builder()
        .setAudioSource(audioSource)
        .setAudioFormat(AudioFormat.Builder().setEncoding(AudioFormat.ENCODING_PCM_16BIT).setSampleRate(safeRate).setChannelMask(channelMask).build())
        .setBufferSizeInBytes(bufferSize)
        .build()
    } catch (_: Throwable) {
      AudioRecord.Builder()
        .setAudioSource(MediaRecorder.AudioSource.MIC)
        .setAudioFormat(AudioFormat.Builder().setEncoding(AudioFormat.ENCODING_PCM_16BIT).setSampleRate(safeRate).setChannelMask(channelMask).build())
        .setBufferSizeInBytes(bufferSize)
        .build()
    }
    check(recorder.state == AudioRecord.STATE_INITIALIZED) { "Unable to initialize microphone recording on this device." }
    session.recorder = recorder
    active = session
    recorder.startRecording()
    session.startNs = System.nanoTime()
    session.thread = Thread({ capture(session) }, "Nexus-Karaoke-Recorder").also { it.start() }
  }

  @Synchronized
  fun stop(): Result {
    val session = active ?: error("No karaoke recording is active.")
    session.running.set(false)
    runCatching { session.thread?.join(1500) }
    cleanup(session)
    active = null
    val processed = processVocals(session.samples, session.sampleRate, session.channels, session.headphoneMode)
    writeAac(File(session.outputPath), processed, session.sampleRate, session.channels)
    val durationMs = processed.size.toDouble() / session.channels / session.sampleRate * 1000.0
    val processing = buildList {
      if (session.headphoneMode) add("Headphone-aware capture")
      if (session.highQuality) add("48 kHz PCM capture")
      add("Adaptive vocal noise suppression")
      add("Low-frequency rumble reduction")
      add("Voice gate with attack/release")
      add("Peak-safe normalization")
      add("AAC-LC/M4A export")
    }
    return Result(File(session.outputPath).absolutePath, durationMs, session.sampleRate, session.channels, "audio/mp4", true, session.headphoneMode, processing)
  }

  @Synchronized
  fun cancel() {
    val session = active ?: return
    session.running.set(false)
    runCatching { session.thread?.join(750) }
    cleanup(session)
    active = null
    runCatching { File(session.outputPath).delete() }
  }

  private fun capture(session: Session) {
    val recorder = session.recorder ?: return
    val buffer = ShortArray(max(1024, session.sampleRate / 20 * session.channels))
    while (session.running.get()) {
      val count = recorder.read(buffer, 0, buffer.size, AudioRecord.READ_BLOCKING)
      if (count > 0) synchronized(session.samples) { for (i in 0 until count) session.samples.add(buffer[i]) }
    }
  }

  private fun cleanup(session: Session) {
    runCatching { session.recorder?.stop() }
    runCatching { session.recorder?.release() }
    session.recorder = null
  }

  /** Conservative vocal cleanup. It reduces stationary noise; it cannot mathematically remove all environmental sound. */
  private fun processVocals(input: List<Short>, sampleRate: Int, channels: Int, headphoneMode: Boolean): ShortArray {
    if (input.isEmpty()) return ShortArray(0)
    val out = ShortArray(input.size)
    val hpState = FloatArray(channels)
    val env = FloatArray(channels)
    val attack = 0.004
    val release = 0.08
    val threshold = if (headphoneMode) 0.012f else 0.018f
    var previous = FloatArray(channels)
    for (i in input.indices step channels) {
      for (c in 0 until channels) {
        val x = input[i + c].toFloat() / 32768f
        val hp = x - hpState[c] + 0.995f * previous[c]
        hpState[c] = hpState[c] * 0.995f + x * 0.005f
        previous[c] = x
        val magnitude = abs(hp)
        val coeff = if (magnitude > env[c]) (1.0 - attack) else (1.0 - release)
        env[c] = (coeff * env[c] + (1.0 - coeff) * magnitude).toFloat()
        val gate = when {
          env[c] < threshold * 0.55f -> 0.04f
          env[c] < threshold -> ((env[c] - threshold * 0.55f) / (threshold * 0.45f)).coerceIn(0f, 1f)
          else -> 1f
        }
        out[i + c] = (hp * gate * 32767f).toInt().coerceIn(-32768, 32767).toShort()
      }
    }
    var peak = 1
    for (s in out) peak = max(peak, abs(s.toInt()))
    val target = min(32700.0, peak * 1.12)
    val gain = target / peak.toDouble()
    for (i in out.indices) out[i] = (out[i] * gain).toInt().coerceIn(-32768, 32767).toShort()
    return out
  }

  private fun writeAac(file: File, samples: ShortArray, sampleRate: Int, channels: Int) {
    file.parentFile?.mkdirs()
    val format = MediaFormat.createAudioFormat("audio/mp4a-latm", sampleRate, channels)
    format.setInteger(MediaFormat.KEY_BIT_RATE, if (channels == 1) 128_000 else 192_000)
    format.setInteger(MediaFormat.KEY_AAC_PROFILE, android.media.MediaCodecInfo.CodecProfileLevel.AACObjectLC)
    val encoder = MediaCodec.createEncoderByType("audio/mp4a-latm")
    val muxer = MediaMuxer(file.absolutePath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
    val info = MediaCodec.BufferInfo()
    var muxTrack = -1
    var muxStarted = false
    var frameOffset = 0
    var inputEos = false
    var done = false
    try {
      encoder.configure(format, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
      encoder.start()
      while (!done) {
        if (!inputEos) {
          val inputIndex = encoder.dequeueInputBuffer(10_000)
          if (inputIndex >= 0) {
            val input = encoder.getInputBuffer(inputIndex) ?: error("Encoder input buffer unavailable.")
            input.clear()
            val framesCap = input.remaining() / (2 * channels)
            val totalFrames = samples.size / channels
            val remaining = totalFrames - frameOffset
            val frames = min(framesCap, remaining)
            if (frames <= 0) {
              encoder.queueInputBuffer(inputIndex, 0, 0, frameOffset.toLong() * 1_000_000L / sampleRate, MediaCodec.BUFFER_FLAG_END_OF_STREAM)
              inputEos = true
            } else {
              var bytes = 0
              for (f in 0 until frames) for (c in 0 until channels) {
                val sample = samples[(frameOffset + f) * channels + c].toInt()
                input.put((sample and 0xff).toByte())
                input.put(((sample shr 8) and 0xff).toByte())
                bytes += 2
              }
              encoder.queueInputBuffer(inputIndex, 0, bytes, frameOffset.toLong() * 1_000_000L / sampleRate, 0)
              frameOffset += frames
            }
          }
        }
        when (val outputIndex = encoder.dequeueOutputBuffer(info, 10_000)) {
          MediaCodec.INFO_TRY_AGAIN_LATER -> Unit
          MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
            check(!muxStarted) { "Encoder output format changed more than once." }
            muxTrack = muxer.addTrack(encoder.outputFormat)
            muxer.start()
            muxStarted = true
          }
          else -> if (outputIndex >= 0) {
            val buffer = encoder.getOutputBuffer(outputIndex) ?: error("Encoder output buffer unavailable.")
            if ((info.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG) != 0) info.size = 0
            if (info.size > 0) {
              check(muxStarted && muxTrack >= 0) { "Audio muxer is not ready." }
              buffer.position(info.offset)
              buffer.limit(info.offset + info.size)
              muxer.writeSampleData(muxTrack, buffer, info)
            }
            encoder.releaseOutputBuffer(outputIndex, false)
            if ((info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) done = true
          }
        }
      }
    } finally {
      runCatching { encoder.stop() }
      encoder.release()
      if (muxStarted) runCatching { muxer.stop() }
      muxer.release()
    }
  }

  fun hasWiredHeadphones(context: Context): Boolean {
    val manager = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: return false
    return manager.getDevices(AudioManager.GET_DEVICES_OUTPUTS).any { device ->
      device.type == AudioDeviceInfo.TYPE_WIRED_HEADPHONES ||
        device.type == AudioDeviceInfo.TYPE_WIRED_HEADSET ||
        device.type == AudioDeviceInfo.TYPE_BLUETOOTH_A2DP ||
        device.type == AudioDeviceInfo.TYPE_BLUETOOTH_SCO
    }
  }
}
