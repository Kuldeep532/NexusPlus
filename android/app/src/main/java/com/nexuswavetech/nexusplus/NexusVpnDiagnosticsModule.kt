package com.nexuswavetech.nexusplus

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/** React Native read-only diagnostics for VPN and local protection health. */
class NexusVpnDiagnosticsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "NexusContentProtectionVpnDiagnostics"

    @ReactMethod
    fun getStats(promise: Promise) {
        runCatching {
            val stats = Arguments.createMap().apply {
                NexusVpnPacketStats.snapshot().forEach { (key, value) -> putDouble(key, value.toDouble()) }
                NexusVpnDnsStats.snapshot().forEach { (key, value) -> putDouble("dns_$key", value.toDouble()) }
            }
            promise.resolve(stats)
        }.onFailure { promise.reject("VPN_STATS", it.message ?: "Unable to read VPN diagnostics") }
    }

    @ReactMethod
    fun classifySafetyText(text: String, promise: Promise) {
        runCatching {
            val decision = NexusScamPatternEngine.classify(text)
            promise.resolve(Arguments.createMap().apply { putString("decision", decision.name) })
        }.onFailure { promise.reject("SAFETY_CLASSIFY", it.message ?: "Unable to classify text") }
    }

    @ReactMethod
    fun resetStats(promise: Promise) {
        runCatching {
            NexusVpnPacketStats.reset()
            NexusVpnDnsStats.reset()
            promise.resolve(true)
        }.onFailure { promise.reject("VPN_STATS_RESET", it.message ?: "Unable to reset VPN diagnostics") }
    }
}
