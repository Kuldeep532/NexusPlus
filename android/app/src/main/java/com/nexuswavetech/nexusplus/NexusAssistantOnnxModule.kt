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
        try {
            promise.resolve(mapOf("available" to true, "version" to "ONNX Runtime GenAI"))
        } catch (error: Throwable) {
            promise.reject("LOCAL_RUNTIME_UNAVAILABLE", "Local AI is not available in this build.", error)
        }
    }

    @ReactMethod
    fun load(modelId: String, modelPath: String, promise: Promise) {
        val dir = File(modelPath)
        val configFile = File(dir, "genai_config.json")
        if (modelId.isBlank() || !dir.isDirectory || !configFile.isFile) {
            promise.reject("LOCAL_MODEL_NOT_READY", "Download the local AI model before using offline chat.")
            return
        }

        try {
            closeRuntime()
            val config = Config(dir.absolutePath)
            model = Model(config)
            tokenizer = Tokenizer(model)
            loadedModelId = modelId
            promise.resolve(Arguments.createMap().apply {
                putString("modelId", modelId)
                putString("path", dir.absolutePath)
            })
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

        try {
            val prompt = buildPrompt(messages)
            val params = GeneratorParams(activeModel)
            val maxTokens = if (options.hasKey("maxTokens") && !options.isNull("maxTokens")) {
                options.getInt("maxTokens").coerceIn(32, 192)
            } else 128
            params.setSearchOption("max_length", maxTokens.toLong())
            params.setSearchOption("temperature", 0.35f)

            val generator = Generator(activeModel, params)
            val promptTokens = activeTokenizer.encode(prompt)
            generator.appendTokens(promptTokens)

            val stream = activeTokenizer.createStream()
            val answer = StringBuilder()
            while (!generator.isDone()) {
                generator.generateNextToken()
                val tokens = generator.getNextTokens()
                if (tokens.isNotEmpty()) {
                    answer.append(stream.decode(tokens[0]))
                }
            }

            stream.close()
            generator.close()
            params.close()

            val text = cleanGeneratedText(answer.toString())
            if (text.isBlank()) {
                promise.reject("LOCAL_EMPTY_RESPONSE", "The local assistant did not return an answer.")
                return
            }
            promise.resolve(text)
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
            out.append("<|im_start|>").append(role).append("\n")
            out.append(content)
            out.append("<|im_end|>\n")
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
