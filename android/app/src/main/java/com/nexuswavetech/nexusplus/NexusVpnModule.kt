package com.nexuswavetech.nexusplus

import android.content.Intent
import android.net.VpnService
import android.os.Build
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class NexusVpnModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "NexusContentProtectionVpn"

    @ReactMethod
    fun getState(promise: Promise) {
        val prepared = VpnService.prepare(reactContext) == null
        promise.resolve(mapOf(
            "prepared" to prepared,
            "consent" to NexusVpnPolicy.hasConsent(reactContext),
            "enabled" to NexusVpnPolicy.isEnabled(reactContext),
        ))
    }

    @ReactMethod
    fun requestConsent(promise: Promise) {
        runCatching {
            val intent = VpnService.prepare(reactContext)
            if (intent == null) {
                NexusVpnPolicy.setConsent(reactContext, true)
                promise.resolve(false)
            } else {
                reactContext.currentActivity?.startActivity(intent)
                    ?: throw IllegalStateException("VPN consent requires a foreground activity")
                promise.resolve(true)
            }
        }.onFailure { promise.reject("VPN_CONSENT", it.message ?: "Unable to request VPN consent") }
    }

    @ReactMethod
    fun start(promise: Promise) {
        runCatching {
            if (VpnService.prepare(reactContext) != null) throw SecurityException("VPN consent is not granted")
            NexusVpnPolicy.setConsent(reactContext, true)
            val intent = Intent(reactContext, NexusContentFilterVpnService::class.java).apply { action = NexusContentFilterVpnService.ACTION_START }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) ContextCompat.startForegroundService(reactContext, intent) else reactContext.startService(intent)
            promise.resolve(true)
        }.onFailure { promise.reject("VPN_START", it.message ?: "Unable to start VPN") }
    }

    @ReactMethod
    fun stop(promise: Promise) {
        runCatching {
            NexusVpnPolicy.setEnabled(reactContext, false)
            reactContext.stopService(Intent(reactContext, NexusContentFilterVpnService::class.java))
            promise.resolve(true)
        }.onFailure { promise.reject("VPN_STOP", it.message ?: "Unable to stop VPN") }
    }
}
