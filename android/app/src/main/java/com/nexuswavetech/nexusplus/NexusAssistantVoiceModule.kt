package com.nexuswavetech.nexusplus

import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.concurrent.thread

class NexusAssistantVoiceModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    private val listening = AtomicBoolean(false)
    private var recordThread: Thread? = null

    override fun getName(): String = "NexusAssistantVoice"

    @ReactMethod
    fun isAvailable(promise: Promise) {
        promise.resolve(hasRecordPermission())
    }

    @ReactMethod
    fun startListening(promise: Promise) {
        if (!hasRecordPermission()) {
            promise.reject("MIC_PERMISSION", "Microphone permission is required.")
            return
        }
        if (!listening.compareAndSet(false, true)) {
            promise.resolve(null)
            return
        }

        recordThread = thread(start = true, name = "NexusAssistantAudioCapture") {
            val sampleRate = 16_000
            val minBuffer = AudioRecord.getMinBufferSize(sampleRate, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT)
            if (minBuffer <= 0) {
                emitState("error", "AUDIO_RECORD_UNAVAILABLE")
                listening.set(false)
                return@thread
            }
            val recorder = AudioRecord(
                MediaRecorder.AudioSource.VOICE_RECOGNITION,
                sampleRate,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT,
                maxOf(minBuffer, sampleRate / 2),
            )
            try {
                recorder.startRecording()
                emitState("listening", null)
                val buffer = ShortArray(maxOf(320, minBuffer / 2))
                while (listening.get()) {
                    val count = recorder.read(buffer, 0, buffer.size)
                    if (count < 0) {
                        emitState("error", "AUDIO_READ_$count")
                        break
                    }
                    // PCM is kept in-process. ASR integration consumes it here when the
                    // downloaded local ASR backend is loaded; it is never uploaded.
                }
            } catch (error: Throwable) {
                emitState("error", error.message ?: "AUDIO_CAPTURE_FAILED")
            } finally {
                try { recorder.stop() } catch (_: Throwable) {}
                recorder.release()
                listening.set(false)
                emitState("idle", null)
            }
        }
        promise.resolve(null)
    }

    @ReactMethod
    fun stopListening(promise: Promise) {
        listening.set(false)
        promise.resolve(null)
    }

    @ReactMethod
    fun stopOutput(promise: Promise) {
        emitState("idle", null)
        promise.resolve(null)
    }

    @ReactMethod
    fun speak(text: String, promise: Promise) {
        if (text.isBlank()) {
            promise.reject("TTS_EMPTY", "Nothing to speak.")
            return
        }
        promise.reject("TTS_BACKEND_UNAVAILABLE", "Local Piper TTS backend is not loaded.")
    }

    private fun hasRecordPermission(): Boolean =
        context.checkSelfPermission(android.Manifest.permission.RECORD_AUDIO) == android.content.pm.PackageManager.PERMISSION_GRANTED

    private fun emitState(state: String, error: String?) {
        val payload: WritableMap = Arguments.createMap().apply {
            putString("state", state)
            if (error == null) putNull("error") else putString("error", error)
        }
        context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("NexusAssistantVoiceState", payload)
    }
}
