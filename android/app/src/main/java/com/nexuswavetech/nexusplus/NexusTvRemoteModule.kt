package com.nexuswavetech.nexusplus

import com.facebook.react.bridge.*
import com.google.android.gms.cast.framework.CastContext

class NexusTvRemoteModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "NexusTvRemote"

    @ReactMethod
    fun isAvailable(promise: Promise) {
        try {
            val session = CastContext.getSharedInstance(reactContext.applicationContext).sessionManager.currentCastSession
            promise.resolve(session != null && session.isConnected)
        } catch (error: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun getSessionDevice(promise: Promise) {
        try {
            val session = CastContext.getSharedInstance(reactContext.applicationContext).sessionManager.currentCastSession
            val device = session?.castDevice
            promise.resolve(Arguments.createMap().apply {
                putBoolean("connected", session != null && session.isConnected)
                if (device != null) {
                    putString("id", device.deviceId)
                    putString("name", device.friendlyName)
                    putString("model", device.modelName)
                    putString("ipAddress", device.inetAddress?.hostAddress)
                }
            })
        } catch (error: Exception) {
            promise.reject("TV_SESSION_FAILED", error.message, error)
        }
    }

    @ReactMethod
    fun sendKey(key: String, promise: Promise) {
        // Google Cast does not expose a universal Android TV system-key injection API.
        // Keep this bridge explicit: receiver-backed TV control will use this same contract.
        promise.reject(
            "TV_KEY_TRANSPORT_UNAVAILABLE",
            "A Nexus TV receiver or compatible TV remote session is required for system-key control."
        )
    }
}
