package com.nexuswavetech.nexusplus

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
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
    fun isAppInstalled(packageName: String, promise: Promise) {
        try {
            val installed = try {
                reactContext.packageManager.getPackageInfo(packageName, 0)
                true
            } catch (_: PackageManager.NameNotFoundException) {
                false
            }
            promise.resolve(installed)
        } catch (error: Exception) {
            promise.reject("APP_CHECK_FAILED", error.message, error)
        }
    }

    @ReactMethod
    fun launchLocalApp(packageName: String, promise: Promise) {
        try {
            val launchIntent = reactContext.packageManager.getLaunchIntentForPackage(packageName)
            if (launchIntent == null) {
                promise.reject("APP_NOT_INSTALLED", "The app is not installed.")
                return
            }
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactContext.startActivity(launchIntent)
            promise.resolve(true)
        } catch (error: Exception) {
            promise.reject("APP_LAUNCH_FAILED", error.message, error)
        }
    }

    @ReactMethod
    fun getReceiverStatus(promise: Promise) {
        promise.resolve(Arguments.createMap().apply {
            putBoolean("available", false)
            putString("reason", "Nexus TV receiver is not installed on this build.")
        })
    }

    @ReactMethod
    fun sendKey(key: String, promise: Promise) {
        promise.reject(
            "TV_KEY_TRANSPORT_UNAVAILABLE",
            "A Nexus TV receiver or compatible TV remote session is required for system-key control."
        )
    }
}
