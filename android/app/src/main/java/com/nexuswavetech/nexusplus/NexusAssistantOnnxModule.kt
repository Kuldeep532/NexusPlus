package com.nexuswavetech.nexusplus

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import ai.onnxruntime.OrtEnvironment
import java.io.File
import java.util.concurrent.ConcurrentHashMap

class NexusAssistantOnnxModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    private val environment: OrtEnvironment by lazy { OrtEnvironment.getEnvironment() }
    private val sessions = ConcurrentHashMap<String, ai.onnxruntime.OrtSession>()

    override fun getName(): String = "NexusAssistantOnnx"

    @ReactMethod
    fun getStatus(promise: Promise) {
        try {
            val payload: WritableMap = Arguments.createMap().apply {
                putBoolean("available", true)
                putString("version", environment.version)
            }
            promise.resolve(payload)
        } catch (error: Throwable) {
            promise.reject("ONNX_RUNTIME_UNAVAILABLE", error)
        }
    }

    @ReactMethod
    fun load(modelId: String, modelPath: String, promise: Promise) {
        try {
            val file = File(modelPath.removePrefix("file://"))
            if (!file.exists() || file.length() == 0L) {
                promise.reject("ONNX_MODEL_NOT_FOUND", "Model file is not present: $modelId")
                return
            }
            sessions.remove(modelId)?.close()
            val options = ai.onnxruntime.OrtSession.SessionOptions()
            options.setIntraOpNumThreads(2)
            val session = environment.createSession(file.absolutePath, options)
            sessions[modelId] = session
            val payload: WritableMap = Arguments.createMap().apply {
                putString("modelId", modelId)
                putString("path", file.absolutePath)
                putInt("inputCount", session.inputNames.size)
                putInt("outputCount", session.outputNames.size)
            }
            promise.resolve(payload)
        } catch (error: Throwable) {
            promise.reject("ONNX_LOAD_FAILED", error)
        }
    }

    @ReactMethod
    fun unload(modelId: String, promise: Promise) {
        sessions.remove(modelId)?.close()
        promise.resolve(null)
    }

    override fun invalidate() {
        sessions.values.forEach { session ->
            try { session.close() } catch (_: Throwable) {}
        }
        sessions.clear()
        super.invalidate()
    }
}
