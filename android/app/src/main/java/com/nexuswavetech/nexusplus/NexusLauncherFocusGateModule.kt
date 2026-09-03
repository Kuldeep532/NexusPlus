package com.nexuswavetech.nexusplus

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class NexusLauncherFocusGateModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "NexusLauncherFocusGate"

    @ReactMethod
    fun getState(promise: Promise) {
        runCatching {
            val windows = NexusLauncherFocusGate.getFocusWindows(reactContext).map { Arguments.makeNativeMap(mapOf("start" to it.first, "end" to it.second)) }
            promise.resolve(Arguments.makeNativeMap(mapOf(
                "enabled" to NexusLauncherFocusGate.isEnabled(reactContext),
                "cooldownMinutes" to NexusLauncherFocusGate.getCooldownMinutes(reactContext),
                "blockedPackages" to NexusLauncherFocusGate.getBlockedPackages(reactContext).toList(),
                "windows" to Arguments.fromList(windows),
            )))
        }.onFailure { error -> promise.reject("FOCUS_GATE_STATE", error.message ?: "Unable to read Focus Gate state.") }
    }

    @ReactMethod
    fun setEnabled(enabled: Boolean, promise: Promise) {
        NexusLauncherFocusGate.setEnabled(reactContext, enabled)
        promise.resolve(true)
    }

    @ReactMethod
    fun setCooldownMinutes(minutes: Int, promise: Promise) {
        if (minutes !in 1..60) {
            promise.reject("FOCUS_GATE_COOLDOWN", "Cooldown must be between 1 and 60 minutes.")
            return
        }
        NexusLauncherFocusGate.setCooldownMinutes(reactContext, minutes)
        promise.resolve(true)
    }

    @ReactMethod
    fun setFocusWindow(startHour: Int, endHour: Int, promise: Promise) {
        if (startHour !in 0..23 || endHour !in 0..23) {
            promise.reject("FOCUS_GATE_WINDOW", "Focus hours must be between 0 and 23.")
            return
        }
        NexusLauncherFocusGate.setFocusWindows(reactContext, listOf(startHour to endHour))
        promise.resolve(true)
    }

    @ReactMethod
    fun setBlockedPackages(packages: List<String>, promise: Promise) {
        val safePackages = packages.filter { it.isNotBlank() && it.length <= 256 }.toSet()
        NexusLauncherFocusGate.setBlockedPackages(reactContext, safePackages)
        promise.resolve(true)
    }
}
