package com.nexuswavetech.nexusplus

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/** React Native read-only diagnostics for VPN health. */
class NexusVpnDiagnosticsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "NexusContentProtectionVpnDiagnostics"

    @ReactMethod
    fun getStats(promise: Promise) {
        runCatching { promise.resolve(NexusVpnPacketStats.snapshot()) }
            .onFailure { promise.reject("VPN_STATS", it.message ?: "Unable to read VPN diagnostics") }
    }

    @ReactMethod
    fun resetStats(promise: Promise) {
        runCatching { NexusVpnPacketStats.reset(); promise.resolve(true) }
            .onFailure { promise.reject("VPN_STATS_RESET", it.message ?: "Unable to reset VPN diagnostics") }
    }
}
