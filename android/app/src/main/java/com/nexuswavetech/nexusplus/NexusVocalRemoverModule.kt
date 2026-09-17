package com.nexuswavetech.nexusplus

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap

/**
 * Native boundary for Android vocal separation.
 * The DSP/ML implementation is intentionally kept behind this API so the
 * JS layer stays platform-independent and model assets are not bundled into
 * the application unless explicitly enabled later.
 */
class NexusVocalRemoverModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "NexusVocalRemover"

    @ReactMethod
    fun isAvailable(promise: Promise) {
        promise.resolve(false)
    }

    @ReactMethod
    fun separate(args: ReadableMap, promise: Promise) {
        promise.reject(
            "VOCAL_ENGINE",
            "Android vocal-removal engine is not linked in this build yet.",
        )
    }

    @ReactMethod
    fun cancel(promise: Promise) {
        promise.resolve(true)
    }

    @ReactMethod
    fun dispose(promise: Promise) {
        promise.resolve(true)
    }
}
