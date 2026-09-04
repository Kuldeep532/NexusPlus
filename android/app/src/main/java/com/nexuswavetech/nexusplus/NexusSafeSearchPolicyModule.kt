package com.nexuswavetech.nexusplus

import android.net.Uri
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class NexusSafeSearchPolicyModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "NexusSafeSearchPolicy"

    @ReactMethod
    fun enforce(url: String, promise: Promise) {
        runCatching { promise.resolve(NexusSafeSearchPolicy.enforce(Uri.parse(url)).toString()) }
            .onFailure { promise.reject("SAFE_SEARCH", it.message ?: "Unable to enforce SafeSearch") }
    }
}
