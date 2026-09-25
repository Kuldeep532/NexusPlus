package com.nexuswavetech.nexusplus

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class NexusNativeSecurityModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "NexusNativeSecurity"

    @ReactMethod
    fun classifyText(text: String, promise: Promise) {
        runCatching {
            if (!ensureNativeLoaded()) throw IllegalStateException("Native security engine is unavailable.")
            promise.resolve(nativeClassifyText(text))
        }.onFailure { promise.reject("NATIVE_CLASSIFY", it.message ?: "Native classification failed") }
    }

    @ReactMethod
    fun runtimeIntegrityOk(promise: Promise) {
        runCatching {
            if (!ensureNativeLoaded()) throw IllegalStateException("Native security engine is unavailable.")
            promise.resolve(nativeRuntimeIntegrityOk())
        }.onFailure { promise.reject("NATIVE_INTEGRITY", it.message ?: "Native integrity check failed") }
    }

    private external fun nativeClassifyText(text: String): Int
    private external fun nativeRuntimeIntegrityOk(): Boolean

    companion object {
        @Volatile private var nativeLoadAttempted = false
        @Volatile private var nativeLoaded = false

        private fun ensureNativeLoaded(): Boolean {
            if (nativeLoaded) return true
            if (nativeLoadAttempted) return false
            synchronized(this) {
                if (nativeLoaded) return true
                if (nativeLoadAttempted) return false
                nativeLoadAttempted = true
                nativeLoaded = runCatching {
                    System.loadLibrary("nexus_security")
                    true
                }.getOrDefault(false)
                return nativeLoaded
            }
        }
    }
}
