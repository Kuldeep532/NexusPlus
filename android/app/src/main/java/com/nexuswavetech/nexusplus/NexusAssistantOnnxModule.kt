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
        if (!dir.exists() || !dir.isDirectory) {
            promise.reject("LOCAL_MODEL_NOT_READY", "Download the local AI model before using offline chat.")
            return
        }
        val modelFile = File(dir, "onnx/model_q4f16.onnx")
        if (!modelFile.exists() || modelFile.length() == 0L) {
            promise.reject("LOCAL_MODEL_NOT_READY", "Download the local AI model before using offline chat.")
            return
        }
        try {
            session?.close()
            val opts = ai.onnxruntime.OrtSession.SessionOptions()
            session = ai.onnxruntime.OrtEnvironment.getEnvironment().createSession(modelFile.absolutePath, opts)
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
        // This graph needs a tokenizer + generation loop. Keep the native module honest
        // rather than returning a fabricated response.
        promise.reject(
            "LOCAL_TEXT_GENERATION_UNAVAILABLE",
            "The local AI model is downloaded, but this build does not yet include its text-generation tokenizer.",
        )
    }

    @ReactMethod
    fun unload(modelId: String, promise: Promise) {
        if (loadedModelId == modelId) closeRuntime()
        promise.resolve(null)
    }

    private fun buildPrompt(messages: ReadableArray): String {
        val out = StringBuilder()
        for (index in 0 until messages.size()) {
            val item = messages.getMap(index) ?: continue
            val role = item.getString("role") ?: "user"
            val content = item.getString("content") ?: continue
            out.append("<|im_start|>").append(role).append("\n").append(content).append("<|im_end|>\n")
        }
        out.append("<|im_start|>assistant\n")
        return out.toString()
    }

    private fun cleanGeneratedText(value: String): String {
        return value
            .substringBefore("<|im_end|>")
            .replace("<|im_start|>assistant", "")
            .trim()
    }

    private fun closeRuntime() {
        try { session?.close() } catch (_: Throwable) {}
        session = null
        loadedModelId = null
    }
}
