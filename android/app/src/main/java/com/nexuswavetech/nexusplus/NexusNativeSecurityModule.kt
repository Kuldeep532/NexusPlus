package com.nexuswavetech.nexusplus

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/** Small JNI facade for Stage 1 native security decisions. */
class NexusNativeSecurityModule(
    private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "NexusNativeSecurity"

    @ReactMethod
    fun classifyText(text: String, promise: Promise) {
        runCatching { promise.resolve(nativeClassifyText(text)) }
            .onFailure { promise.reject("NATIVE_CLASSIFY", it.message ?: "Native classification failed.") }
    }

    @ReactMethod
    fun runtimeIntegrityOk(promise: Promise) {
        runCatching { promise.resolve(nativeRuntimeIntegrityOk()) }
            .onFailure { promise.reject("NATIVE_INTEGRITY", it.message ?: "Native integrity check failed.") }
    }

    private external fun nativeClassifyText(text: String): Int
    private external fun nativeRuntimeIntegrityOk(): Boolean

    companion object {
        init {
            System.loadLibrary("nexus_security")
        }
    }
}
