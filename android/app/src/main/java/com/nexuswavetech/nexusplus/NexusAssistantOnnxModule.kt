package com.nexuswavetech.nexusplus

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Small React Native boundary for the optional Assistant ONNX runtime.
 *
 * The actual ONNX runtime dependency is enabled only in the Android app build;
 * downloaded model files stay outside the APK in app-private storage.
 */
class NexusAssistantOnnxModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    override fun getName(): String = "NexusAssistantOnnx"

    @ReactMethod
    fun getStatus(promise: Promise) {
        // Report the bridge as unavailable until the Android build links a real
        // ONNX Runtime implementation. This prevents the UI from claiming that
        // offline AI is ready when only the bridge is present.
        promise.resolve(mapOf("available" to false, "version" to "onnx-runtime-bridge"))
    }

    @ReactMethod
    fun load(modelId: String, modelPath: String, promise: Promise) {
        if (modelId.isBlank() || modelPath.isBlank()) {
            promise.reject("ONNX_MODEL_INVALID", "The selected local AI model is not available.")
            return
        }
        // Validate the downloaded model path here. A concrete ONNX Runtime
        // session is enabled only when the Android dependency is linked.
        val file = java.io.File(modelPath)
        if (!file.exists() || file.length() <= 0L) {
            promise.reject("ONNX_MODEL_NOT_FOUND", "The local AI model could not be found on this device.")
            return
        }
        promise.resolve(
            mapOf(
                "modelId" to modelId,
                "path" to file.absolutePath,
                "inputCount" to 1,
                "outputCount" to 1,
            ),
        )
    }

    @ReactMethod
    fun unload(modelId: String, promise: Promise) {
        promise.resolve(null)
    }
}
