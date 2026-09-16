package com.nexuswavetech.nexusplus

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Stable native authentication boundary.
 * A real Google credential provider can be wired behind this contract later;
 * this module never fabricates an authenticated user or token.
 */
class NexusAuthModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "NexusAuth"

    @ReactMethod
    fun signInWithGoogle(promise: Promise) {
        promise.reject("AUTH_PROVIDER_UNAVAILABLE", "Google sign-in is not configured in this Android build.")
    }

    @ReactMethod
    fun signOut(promise: Promise) {
        promise.resolve(null)
    }

    @ReactMethod
    fun getCurrentUser(promise: Promise) {
        promise.resolve(null)
    }
}
