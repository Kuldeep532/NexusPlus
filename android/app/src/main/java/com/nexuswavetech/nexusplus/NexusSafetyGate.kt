package com.nexuswavetech.nexusplus

import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.view.accessibility.AccessibilityManager

/** First-run safety gate. It never grants Android permissions; it only verifies user-enabled protection. */
object NexusSafetyGate {
    private const val PREFS = "nexus_safety_gate"
    private const val KEY_ACKNOWLEDGED = "safety_acknowledged"

    fun isAcknowledged(context: Context): Boolean =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getBoolean(KEY_ACKNOWLEDGED, false)

    fun acknowledge(context: Context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putBoolean(KEY_ACKNOWLEDGED, true)
            .apply()
    }

    fun isSafetyAccessibilityEnabled(context: Context): Boolean {
        val manager = context.getSystemService(Context.ACCESSIBILITY_SERVICE) as? AccessibilityManager
            ?: return false
        val services = manager.getEnabledAccessibilityServiceList(
            AccessibilityServiceInfo.FEEDBACK_ALL_MASK,
        )
        return services.any { it.resolveInfo?.serviceInfo?.packageName == context.packageName }
    }

    fun openAccessibilitySettings(context: Context) {
        context.startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        })
    }

    fun isReady(context: Context): Boolean =
        isAcknowledged(context) && isSafetyAccessibilityEnabled(context)
}
