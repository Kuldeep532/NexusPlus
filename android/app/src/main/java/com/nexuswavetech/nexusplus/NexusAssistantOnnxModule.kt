package com.nexuswavetech.nexusplus

import ai.onnxruntime.genai.Config
import ai.onnxruntime.genai.Generator
import ai.onnxruntime.genai.GeneratorParams
import ai.onnxruntime.genai.Model
import ai.onnxruntime.genai.Tokenizer
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

    private var model: Model? = null
    private var tokenizer: Tokenizer? = null
    private var loadedModelId: String? = null

    @ReactMethod
    fun getStatus(promise: Promise) {
        promise.resolve(
            mapOf(
                "available" to true,
                "version" to "ONNX Runtime GenAI",
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
        if (!dir.exists() || !dir.isDirectory || !File(dir, "genai_config.json").exists()) {
            promise.reject("LOCAL_MODEL_NOT_READY", "Download the local AI model before using offline chat.")
            return
        }

        try {
            closeRuntime()
            val config = Config(dir.absolutePath)
            model = Model(config)
            tokenizer = Tokenizer(model)
            loadedModelId = modelId

            promise.resolve(
                Arguments.createMap().apply {
                    putString("modelId", modelId)
                    putString("path", dir.absolutePath)
                },
            )
        } catch (error: Throwable) {
            closeRuntime()
            promise.reject("LOCAL_MODEL_LOAD_FAILED", "The local AI model could not be prepared on this device.", error)
        }
    }

    @ReactMethod
    fun generate(modelId: String, messages: ReadableArray, options: ReadableMap, promise: Promise) {
        val activeModel = model
        val activeTokenizer = tokenizer
        if (activeModel == null || activeTokenizer == null || loadedModelId != modelId) {
            promise.reject("LOCAL_MODEL_NOT_READY", "The local AI model is not ready.")
            return
        }

        val prompt = buildPrompt(messages)
        val maxTokens = if (options.hasKey("maxTokens") && !options.isNull("maxTokens")) {
            options.getInt("maxTokens").coerceIn(16, 256)
        } else 160

        try {
            val params = GeneratorParams(activeModel)
            params.setSearchOption("max_length", maxTokens.toLong())
            params.setSearchOption("temperature", 0.35f)
            val generator = Generator(activeModel, params)
            val encoded = activeTokenizer.encode(prompt)
            generator.appendTokens(encoded)

            val stream = activeTokenizer.createStream()
            val output = StringBuilder()
            while (!generator.isDone()) {
                generator.generateNextToken()
                val tokens = generator.getNextTokens()
                if (tokens.isNotEmpty()) {
                    output.append(stream.decode(tokens[0]))
                }
            }

            generator.close()
            params.close()
            stream.close()

            val answer = cleanGeneratedText(output.toString())
            if (answer.isBlank()) {
                promise.reject("LOCAL_EMPTY_RESPONSE", "The local assistant did not return an answer.")
                return
            }
            promise.resolve(answer)
        } catch (error: Throwable) {
            promise.reject("LOCAL_GENERATION_FAILED", "The local assistant could not generate a response.", error)
        }
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
        try { tokenizer?.close() } catch (_: Throwable) {}
        try { model?.close() } catch (_: Throwable) {}
        tokenizer = null
        model = null
        loadedModelId = null
    }
}
