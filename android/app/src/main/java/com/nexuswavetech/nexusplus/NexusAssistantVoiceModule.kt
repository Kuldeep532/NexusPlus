package com.nexuswavetech.nexusplus

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.concurrent.atomic.AtomicBoolean

class NexusAssistantVoiceModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    private val listening = AtomicBoolean(false)
    private var recognizer: SpeechRecognizer? = null

    override fun getName(): String = "NexusAssistantVoice"

    @ReactMethod
    fun isAvailable(promise: Promise) {
        promise.resolve(hasRecordPermission() && SpeechRecognizer.isRecognitionAvailable(context))
    }

    @ReactMethod
    fun startListening(promise: Promise) {
        if (!hasRecordPermission()) {
            promise.reject("MIC_PERMISSION", "Microphone permission is required.")
            return
        }
        if (!SpeechRecognizer.isRecognitionAvailable(context)) {
            promise.reject("ASR_UNAVAILABLE", "Android speech recognition is unavailable on this device.")
            return
        }
        if (!listening.compareAndSet(false, true)) {
            promise.resolve(null)
            return
        }

        emitState("listening", null)
        val speech = SpeechRecognizer.createSpeechRecognizer(context).also { recognizer = it }
        speech.setRecognitionListener(object : RecognitionListener {
            override fun onReadyForSpeech(params: Bundle?) = Unit
            override fun onBeginningOfSpeech() = Unit
            override fun onRmsChanged(rmsdB: Float) = Unit
            override fun onBufferReceived(buffer: ByteArray?) = Unit
            override fun onEndOfSpeech() = emitState("processing", null)
            override fun onError(error: Int) {
                listening.set(false)
                destroyRecognizer()
                emitState("error", "ASR_ERROR_$error")
                emitState("idle", null)
            }
            override fun onResults(results: Bundle?) {
                val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                val transcript = matches?.firstOrNull()?.trim().orEmpty()
                listening.set(false)
                if (transcript.isNotBlank()) emitTranscript(transcript)
                destroyRecognizer()
                emitState("idle", null)
            }
            override fun onPartialResults(partialResults: Bundle?) = Unit
            override fun onEvent(eventType: Int, params: Bundle?) = Unit
        })
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false)
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3)
            putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-IN")
        }
        try {
            speech.startListening(intent)
            promise.resolve(null)
        } catch (error: Throwable) {
            listening.set(false)
            destroyRecognizer()
            promise.reject("ASR_START_FAILED", error.message, error)
        }
    }

    @ReactMethod
    fun stopListening(promise: Promise) {
        listening.set(false)
        recognizer?.runCatching { stopListening() }
        destroyRecognizer()
        emitState("idle", null)
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
        ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED

    private fun destroyRecognizer() {
        recognizer?.runCatching { cancel() }
        recognizer?.destroy()
        recognizer = null
    }

    private fun emitTranscript(text: String) {
        val payload: WritableMap = Arguments.createMap().apply {
            putString("state", "processing")
            putString("transcript", text.take(2000))
        }
        context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("NexusAssistantVoiceState", payload)
    }

    private fun emitState(state: String, error: String?) {
        val payload: WritableMap = Arguments.createMap().apply {
            putString("state", state)
            if (error == null) putNull("error") else putString("error", error)
        }
        context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("NexusAssistantVoiceState", payload)
    }
}
