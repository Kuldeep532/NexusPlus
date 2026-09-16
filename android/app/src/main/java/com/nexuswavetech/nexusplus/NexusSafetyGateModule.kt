package com.nexuswavetech.nexusplus

import android.content.ComponentName
import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Android safety setup bridge. The module only reports the real Accessibility
 * Service state and stores explicit acknowledgement locally; it never enables
 * the service silently.
 */
class NexusSafetyGateModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    companion object {
        private const val PREFS = "nexus_safety_gate"
        private const val ACKNOWLEDGED = "acknowledged"
        private const val SERVICE_CLASS = "com.nexuswavetech.nexusplus.NexusSafetyAccessibilityService"
    }

    override fun getName(): String = "NexusSafetyGate"

    @ReactMethod
    fun getState(promise: Promise) {
        runCatching {
            val enabled = isAccessibilityServiceEnabled()
            Arguments.createMap().apply {
                putBoolean("acknowledged", reactContext.getSharedPreferences(PREFS, 0).getBoolean(ACKNOWLEDGED, false))
                putBoolean("accessibilityEnabled", enabled)
                putBoolean("ready", enabled)
            }
        }.onSuccess(promise::resolve).onFailure { promise.reject("SAFETY_STATE", it.message, it) }
    }

    @ReactMethod
    fun acknowledge(promise: Promise) {
        runCatching {
            reactContext.getSharedPreferences(PREFS, 0).edit().putBoolean(ACKNOWLEDGED, true).apply()
            true
        }.onSuccess(promise::resolve).onFailure { promise.reject("SAFETY_ACK", it.message, it) }
    }

    @ReactMethod
    fun openAccessibilitySettings(promise: Promise) {
        runCatching {
            reactContext.startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
            true
        }.onSuccess(promise::resolve).onFailure { promise.reject("SAFETY_SETTINGS", it.message, it) }
    }

    private fun isAccessibilityServiceEnabled(): Boolean {
        val expected = ComponentName(reactContext, SERVICE_CLASS)
        val enabled = Settings.Secure.getString(reactContext.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES)
            ?: return false
        return enabled.split(':').any { ComponentName.unflattenFromString(it)?.packageName == expected.packageName && ComponentName.unflattenFromString(it)?.className == expected.className }
    }
}
