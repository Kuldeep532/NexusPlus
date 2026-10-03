package com.nexuswavetech.nexusplus

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Compatibility boundary retained for older callers.
 * Authentication is handled by the Supabase web/PKCE flow used by the React layer.
 * This module does not claim to provide an independent Google credential flow.
 */
class NexusAuthModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "NexusAuth"

    @ReactMethod
    fun signInWithGoogle(promise: Promise) {
        promise.reject("AUTH_USE_SUPABASE_FLOW", "Google sign-in is handled by the account sign-in screen.")
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
