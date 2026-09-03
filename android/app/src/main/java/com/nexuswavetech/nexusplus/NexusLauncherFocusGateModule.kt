package com.nexuswavetech.nexusplus

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/** React Native bridge for the launcher-only Focus Gate settings. */
class NexusLauncherFocusGateModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "NexusLauncherFocusGate"

    @ReactMethod
    fun getState(promise: Promise) {
        try {
            val map = Arguments.createMap()
            map.putBoolean("enabled", NexusLauncherFocusGate.isEnabled(reactContext))
            map.putInt("cooldownMinutes", NexusLauncherFocusGate.getCooldownMinutes(reactContext))
            map.putInt("savedToday", NexusLauncherFocusGate.getSavedDistractionsToday(reactContext))
            val blocked = Arguments.createArray()
            NexusLauncherFocusGate.getBlockedPackages(reactContext).forEach(blocked::pushString)
            map.putArray("blockedPackages", blocked)
            val windows = Arguments.createArray()
            NexusLauncherFocusGate.getFocusWindows(reactContext).forEach { (start, end) ->
                val item = Arguments.createMap()
                item.putInt("start", start)
                item.putInt("end", end)
                windows.pushMap(item)
            }
            map.putArray("focusWindows", windows)
            promise.resolve(map)
        } catch (error: Throwable) {
            promise.reject("FOCUS_GATE_STATE", error.message ?: "Unable to read Focus Gate state.", null)
        }
    }

    @ReactMethod
    fun setEnabled(enabled: Boolean, promise: Promise) {
        runCatching {
            NexusLauncherFocusGate.setEnabled(reactContext, enabled)
            promise.resolve(true)
        }.onFailure { error ->
            promise.reject("FOCUS_GATE_ENABLED", error.message ?: "Unable to update Focus Gate.", null)
        }
    }

    @ReactMethod
    fun setCooldownMinutes(minutes: Int, promise: Promise) {
        runCatching {
            require(minutes in 1..60) { "Cooldown must be between 1 and 60 minutes." }
            NexusLauncherFocusGate.setCooldownMinutes(reactContext, minutes)
            promise.resolve(true)
        }.onFailure { error ->
            promise.reject("FOCUS_GATE_COOLDOWN", error.message ?: "Unable to update cooldown.", null)
        }
    }

    @ReactMethod
    fun setFocusWindow(startHour: Int, endHour: Int, promise: Promise) {
        runCatching {
            require(startHour in 0..23 && endHour in 0..23) { "Focus hours must be between 0 and 23." }
            NexusLauncherFocusGate.setFocusWindows(reactContext, listOf(startHour to endHour))
            promise.resolve(true)
        }.onFailure { error ->
            promise.reject("FOCUS_GATE_WINDOW", error.message ?: "Unable to update focus window.", null)
        }
    }

    @ReactMethod
    fun setBlockedPackages(packages: Array<String>, promise: Promise) {
        runCatching {
            NexusLauncherFocusGate.setBlockedPackages(reactContext, packages.filter { it.isNotBlank() }.take(100).toSet())
            promise.resolve(true)
        }.onFailure { error ->
            promise.reject("FOCUS_GATE_APPS", error.message ?: "Unable to update protected apps.", null)
        }
    }
}
