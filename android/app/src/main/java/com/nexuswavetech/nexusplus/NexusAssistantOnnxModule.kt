package com.nexuswavetech.nexusplus

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import java.io.File

class NexusAssistantOnnxModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    override fun getName(): String = "NexusAssistantOnnx"

    private var session: ai.onnxruntime.OrtSession? = null
    private var loadedModelId: String? = null

    @ReactMethod
    fun getStatus(promise: Promise) {
        promise.resolve(
            mapOf(
                "available" to true,
                "version" to ai.onnxruntime.OrtVersion.VERSION,
            ),
        )
    }

    @ReactMethod
    fun load(modelId: String, modelPath: String, promise: Promise) {
        if (modelId.isBlank() || modelPath.isBlank()) {
            promise.reject("LOCAL_MODEL_INVALID", "The selected local AI model is not available.")
            return
        }

        val dir = File(modelPath)
        val modelFile = File(dir, "onnx/model_q4f16.onnx")
        val tokenizer = File(dir, "tokenizer.json")
        if (!dir.isDirectory || !modelFile.isFile || modelFile.length() <= 0L || !tokenizer.isFile) {
            promise.reject("LOCAL_MODEL_NOT_READY", "Download the local AI model before using offline chat.")
            return
        }

        try {
            session?.close()
            val options = ai.onnxruntime.OrtSession.SessionOptions().apply {
                setIntraOpNumThreads(2)
                setInterOpNumThreads(1)
            }
            session = ai.onnxruntime.OrtEnvironment.getEnvironment().createSession(modelFile.absolutePath, options)
            loadedModelId = modelId

            promise.resolve(
                Arguments.createMap().apply {
                    putString("modelId", modelId)
                    putString("path", dir.absolutePath)
                    putInt("inputCount", session?.inputNames?.size ?: 0)
                    putInt("outputCount", session?.outputNames?.size ?: 0)
                },
            )
        } catch (error: Throwable) {
            session = null
            loadedModelId = null
            promise.reject("LOCAL_MODEL_LOAD_FAILED", "The local AI model could not be prepared on this device.", error)
        }
    }

    @ReactMethod
    fun generate(modelId: String, messages: ReadableArray, options: ReadableMap, promise: Promise) {
        if (session == null || loadedModelId != modelId) {
            promise.reject("LOCAL_MODEL_NOT_READY", "The local AI model is not ready.")
            return
        }

        // The downloaded SmolLM2 ONNX file is a model graph, not a complete
        // text-generation runtime by itself. A compatible tokenizer + autoregressive
        // generation bridge is required before arbitrary text can be generated safely.
        promise.reject(
            "LOCAL_TEXT_GENERATION_UNAVAILABLE",
            "Offline chat is not available on this build yet.",
        )
    }

    @ReactMethod
    fun unload(modelId: String, promise: Promise) {
        if (loadedModelId == modelId) closeRuntime()
        promise.resolve(null)
    }

    private fun closeRuntime() {
        try { session?.close() } catch (_: Throwable) {}
        session = null
        loadedModelId = null
    }
}
