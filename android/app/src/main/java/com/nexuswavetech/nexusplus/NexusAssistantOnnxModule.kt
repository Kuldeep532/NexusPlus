package com.nexuswavetech.nexusplus

import ai.onnxruntime.OnnxTensor
import ai.onnxruntime.OrtEnvironment
import ai.onnxruntime.OrtSession
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.nio.LongBuffer

/**
 * Android ONNX Runtime bridge for the optional local Assistant model.
 *
 * The model is downloaded to app-private storage. The APK contains only the
 * ONNX Runtime library; model weights are not bundled.
 *
 * NOTE: the current downloadable model must expose a compatible token-input
 * graph. The bridge intentionally fails closed when the graph contract cannot
 * be met instead of returning a fake response.
 */
class NexusAssistantOnnxModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    override fun getName(): String = "NexusAssistantOnnx"

    private val environment: OrtEnvironment by lazy { OrtEnvironment.getEnvironment() }
    private var session: OrtSession? = null
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
            promise.reject("ONNX_MODEL_INVALID", "The selected local AI model is not available.")
            return
        }
        val file = File(modelPath)
        if (!file.exists() || file.length() <= 0L) {
            promise.reject("ONNX_MODEL_NOT_FOUND", "The local AI model could not be found on this device.")
            return
        }
        try {
            session?.close()
            val options = OrtSession.SessionOptions()
            session = environment.createSession(file.absolutePath, options)
            loadedModelId = modelId
            val result = Arguments.createMap().apply {
                putString("modelId", modelId)
                putString("path", file.absolutePath)
                putInt("inputCount", session?.inputNames?.size ?: 0)
                putInt("outputCount", session?.outputNames?.size ?: 0)
            }
            promise.resolve(result)
        } catch (error: Throwable) {
            session = null
            loadedModelId = null
            promise.reject("ONNX_MODEL_LOAD_FAILED", "The local AI model could not be loaded.", error)
        }
    }

    @ReactMethod
    fun generate(modelId: String, messages: com.facebook.react.bridge.ReadableArray, options: com.facebook.react.bridge.ReadableMap, promise: Promise) {
        val activeSession = session
        if (activeSession == null || loadedModelId != modelId) {
            promise.reject("ONNX_MODEL_NOT_LOADED", "The local AI model is not ready.")
            return
        }

        // A generic text-generation ONNX model needs a tokenizer and graph
        // contract. We do not have a tokenizer runtime bundled in this app yet,
        // so fail clearly instead of pretending to generate text.
        promise.reject(
            "ONNX_TOKENIZER_UNAVAILABLE",
            "The local AI model is downloaded, but its text tokenizer is not available in this build.",
        )
    }

    @ReactMethod
    fun unload(modelId: String, promise: Promise) {
        if (loadedModelId == modelId) {
            session?.close()
            session = null
            loadedModelId = null
        }
        promise.resolve(null)
    }
}
