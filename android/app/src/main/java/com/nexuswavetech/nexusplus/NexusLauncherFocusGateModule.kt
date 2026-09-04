package com.nexuswavetech.nexusplus

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/** React Native bridge for the shared local Nexus Focus Gate policy. */
class NexusLauncherFocusGateModule(
    private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "NexusLauncherFocusGate"

    @ReactMethod
    fun getState(promise: Promise) {
        runCatching {
            val map = Arguments.createMap()
            map.putBoolean("enabled", NexusLauncherFocusGate.isEnabled(reactContext))
            map.putBoolean("protectionConsent", NexusLauncherFocusGate.hasProtectionConsent(reactContext))
            map.putBoolean("launcherDefault", NexusLauncherFocusGate.isLauncherDefault(reactContext))
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
        }.onFailure { error ->
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
            require(startHour in 0..23 && endHour in 0..23) {
                "Focus hours must be between 0 and 23."
            }
            NexusLauncherFocusGate.setFocusWindows(reactContext, listOf(startHour to endHour))
            promise.resolve(true)
        }.onFailure { error ->
            promise.reject("FOCUS_GATE_WINDOW", error.message ?: "Unable to update focus window.", null)
        }
    }

    @ReactMethod
    fun setBlockedPackages(packages: Array<String>, promise: Promise) {
        runCatching {
            NexusLauncherFocusGate.setBlockedPackages(
                reactContext,
                packages.map(String::trim).filter(String::isNotBlank).take(100).toSet(),
            )
            promise.resolve(true)
        }.onFailure { error ->
            promise.reject("FOCUS_GATE_APPS", error.message ?: "Unable to update protected apps.", null)
        }
    }

    @ReactMethod
    fun evaluatePackage(packageName: String, promise: Promise) {
        runCatching {
            val decision = NexusLauncherFocusGate.evaluateInNexusPlus(reactContext, packageName)
            val map = Arguments.createMap()
            map.putBoolean("blocked", decision.blocked)
            map.putString("label", decision.label)
            map.putString("message", decision.message)
            map.putBoolean("canGrantCooldown", decision.canGrantCooldown)
            map.putInt("remainingMinutes", decision.remainingMinutes)
            promise.resolve(map)
        }.onFailure { error ->
            promise.reject("FOCUS_GATE_EVALUATE", error.message ?: "Unable to evaluate protection.", null)
        }
    }

    @ReactMethod
    fun allowTemporarily(packageName: String, promise: Promise) {
        runCatching {
            require(packageName.isNotBlank()) { "Package name cannot be blank." }
            NexusLauncherFocusGate.allowTemporarily(reactContext, packageName)
            promise.resolve(true)
        }.onFailure { error ->
            promise.reject("FOCUS_GATE_COOLDOWN_GRANT", error.message ?: "Unable to grant a temporary pause.", null)
        }
    }

    @ReactMethod
    fun recordSavedDistraction(promise: Promise) {
        runCatching {
            NexusLauncherFocusGate.recordSavedDistraction(reactContext)
            promise.resolve(NexusLauncherFocusGate.getSavedDistractionsToday(reactContext))
        }.onFailure { error ->
            promise.reject("FOCUS_GATE_PROGRESS", error.message ?: "Unable to update wellness progress.", null)
        }
    }

    @ReactMethod
    fun getWellnessMetrics(promise: Promise) {
        runCatching {
            val snapshot = NexusWellnessMetrics.snapshot(reactContext)
            val map = Arguments.createMap()
            map.putInt("scrollAttempts", snapshot.scrollAttempts)
            map.putInt("blockedEvents", snapshot.blockedEvents)
            map.putInt("alternativeSessions", snapshot.alternativeSessions)
            map.putString("lastEvent", snapshot.lastEvent)
            promise.resolve(map)
        }.onFailure { error ->
            promise.reject("WELLNESS_METRICS", error.message ?: "Unable to read local wellness metrics.", null)
        }
    }
}
