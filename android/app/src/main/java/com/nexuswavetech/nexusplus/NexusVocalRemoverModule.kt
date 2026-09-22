package com.nexuswavetech.nexusplus

import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.nexuswavetech.nexusplus.vocal.VocalRemoverNative
import java.io.File
import java.util.concurrent.Executors
import java.util.concurrent.Future

class NexusVocalRemoverModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val executor = Executors.newSingleThreadExecutor()
    private val mainHandler = Handler(Looper.getMainLooper())
    private var activeJob: Future<*>? = null

    override fun getName(): String = "NexusVocalRemover"

    @ReactMethod
    fun isAvailable(promise: Promise) {
        try {
            promise.resolve(VocalRemoverNative.nativeIsAvailable())
        } catch (error: Throwable) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun separate(args: ReadableMap, promise: Promise) {
        val inputPath = args.getString("inputPath")?.trim().orEmpty()
        val outputPath = args.getString("outputPath")?.trim().orEmpty()
        require(inputPath.isNotEmpty()) { "Input audio path is required." }
        require(outputPath.isNotEmpty()) { "Output audio path is required." }

        activeJob?.cancel(true)
        activeJob = executor.submit {
            try {
                emit("preparing", 0.02, "Preparing native audio separator")
                val quality = when (args.getString("quality")) {
                    "preview" -> 0
                    "studio" -> 2
                    else -> 1
                }
                val preserveBass = args.getBoolean("preserveBass", true)
                val preserveStereo = args.getBoolean("preserveStereo", true)
                val nativeResult = VocalRemoverNative.nativeSeparate(
                    inputPath,
                    outputPath,
                    quality,
                    preserveBass,
                    preserveStereo,
                )

                if (nativeResult.isNullOrBlank()) {
                    throw IllegalStateException("Vocal remover returned no output.")
                }
                if (nativeResult.startsWith("ERROR:")) {
                    throw IllegalStateException(nativeResult.removePrefix("ERROR:").ifBlank { "Native vocal removal failed." })
                }
                if (!File(nativeResult).isFile || File(nativeResult).length() <= 44L) {
                    throw IllegalStateException("Vocal remover did not create a valid output file.")
                }
                emit("complete", 1.0, "Vocal separation complete")
                promise.resolve(nativeResult)
            } catch (error: Throwable) {
                emit("error", 1.0, error.message ?: "Vocal separation failed.")
                promise.reject("VOCAL_ENGINE", error.message ?: "Vocal separation failed.", error)
            } finally {
                try { VocalRemoverNative.nativeDispose() } catch (_: Throwable) {}
            }
        }
    }

    private fun emit(stage: String, progress: Double, message: String) {
        mainHandler.post {
            try {
                val payload = Arguments.createMap().apply {
                    putString("stage", stage)
                    putDouble("progress", progress)
                    putString("message", message)
                }
                sendEvent("vocalRemovalProgress", payload)
            } catch (_: Throwable) {}
        }
    }

    private fun sendEvent(name: String, payload: com.facebook.react.bridge.WritableMap) {
        reactApplicationContext
            .getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(name, payload)
    }

    @ReactMethod
    fun cancel(promise: Promise) {
        executor.execute {
            try {
                activeJob?.cancel(true)
                VocalRemoverNative.nativeCancel()
                promise.resolve(true)
            } catch (_: Throwable) {
                promise.resolve(false)
            }
        }
    }

    @ReactMethod
    fun dispose(promise: Promise) {
        executor.execute {
            try {
                activeJob?.cancel(true)
                VocalRemoverNative.nativeDispose()
                promise.resolve(true)
            } catch (_: Throwable) {
                promise.resolve(false)
            }
        }
    }
}
