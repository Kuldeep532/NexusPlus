package com.nexuswavetech.nexusplus

import com.facebook.react.bridge.*
import com.google.android.gms.cast.CastDevice
import com.google.android.gms.cast.CastMediaControlIntent
import com.google.android.gms.cast.framework.CastContext
import com.google.android.gms.cast.framework.CastSession

class NexusTvCastModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "NexusTvCast"

    @ReactMethod
    fun isAvailable(promise: Promise) {
        try {
            val context = reactContext.applicationContext
            CastContext.getSharedInstance(context)
            promise.resolve(true)
        } catch (error: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun getSessionDevice(promise: Promise) {
        try {
            val session = CastContext.getSharedInstance(reactContext.applicationContext).sessionManager.currentCastSession
            val device = session?.castDevice
            promise.resolve(deviceMap(device, session))
        } catch (error: Exception) {
            promise.reject("TV_SESSION_FAILED", error.message, error)
        }
    }

    private fun deviceMap(device: CastDevice?, session: CastSession?): WritableMap {
        return Arguments.createMap().apply {
            putBoolean("connected", session != null && session.isConnected)
            if (device != null) {
                putString("id", device.deviceId)
                putString("name", device.friendlyName)
                putString("model", device.modelName)
                putString("ipAddress", device.inetAddress?.hostAddress)
                putString("deviceVersion", device.deviceVersion)
            }
        }
    }
}
