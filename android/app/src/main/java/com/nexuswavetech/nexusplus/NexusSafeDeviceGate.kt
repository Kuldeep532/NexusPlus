package com.nexuswavetech.nexusplus

import android.content.ComponentName
import android.content.Context
import android.provider.Settings

/** First-run safety gate for Nexus Plus protected features. */
object NexusSafeDeviceGate {
    private const val PREFS = "nexus_safe_device_gate"
    private const val KEY_ACK = "safety_acknowledged"

    fun isSafetyAcknowledged(context: Context): Boolean =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getBoolean(KEY_ACK, false)

    fun acknowledgeSafety(context: Context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putBoolean(KEY_ACK, true)
            .apply()
    }

    fun isAccessibilityServiceEnabled(context: Context): Boolean {
        val service = ComponentName(context, NexusSafetyAccessibilityService::class.java)
        val enabled = Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES,
        ) ?: return false
        return enabled.split(':').any { ComponentName.unflattenFromString(it) == service }
    }

    fun isProtectedShellReady(context: Context): Boolean =
        isSafetyAcknowledged(context) && isAccessibilityServiceEnabled(context)
}
