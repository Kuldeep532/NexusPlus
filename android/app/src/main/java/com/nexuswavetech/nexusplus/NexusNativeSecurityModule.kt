package com.nexuswavetech.nexusplus

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class NexusNativeSecurityModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "NexusNativeSecurity"

    @ReactMethod
    fun classifyText(text: String, promise: Promise) {
        runCatching { promise.resolve(nativeClassifyText(text)) }
            .onFailure { promise.reject("NATIVE_CLASSIFY", it.message ?: "Native classification failed") }
    }

    @ReactMethod
    fun classifyDomain(domain: String, promise: Promise) {
        runCatching { promise.resolve(nativeClassifyDomain(domain)) }
            .onFailure { promise.reject("NATIVE_DOMAIN_CLASSIFY", it.message ?: "Native domain classification failed") }
    }

    @ReactMethod
    fun runtimeIntegrityOk(promise: Promise) {
        runCatching { promise.resolve(nativeRuntimeIntegrityOk()) }
            .onFailure { promise.reject("NATIVE_INTEGRITY", it.message ?: "Native integrity check failed") }
    }

    private external fun nativeClassifyText(text: String): Int
    private external fun nativeClassifyDomain(domain: String): Int
    private external fun nativeRuntimeIntegrityOk(): Boolean

    companion object { init { System.loadLibrary("nexus_security") } }
}
