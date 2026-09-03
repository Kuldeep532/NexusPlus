package com.nexuswavetech.nexusplus

import android.content.Context
import java.util.Calendar

/**
 * Nexus-specific opening guard. This is intentionally launcher-local and on-device.
 * It does not use Digital Wellbeing, UsageStats, a server, an account, or an external API.
 */
object NexusLauncherFocusGate {
    private const val PREFS = "nexus_launcher_focus_gate"
    private const val KEY_ENABLED = "enabled"
    private const val KEY_BLOCKED = "blocked_packages"
    private const val KEY_WINDOWS = "focus_windows"
    private const val KEY_COOLDOWN_MINUTES = "cooldown_minutes"
    private const val KEY_BYPASS_UNTIL = "bypass_until"
    private const val KEY_BYPASS_PACKAGE = "bypass_package"
    private const val WINDOW_SEPARATOR = "|"
    private const val FIELD_SEPARATOR = ","

    data class Decision(
        val blocked: Boolean,
        val label: String,
        val message: String,
        val remainingMinutes: Int = 0,
    )

    fun setEnabled(context: Context, enabled: Boolean) {
        prefs(context).edit().putBoolean(KEY_ENABLED, enabled).apply()
    }

    fun isEnabled(context: Context): Boolean = prefs(context).getBoolean(KEY_ENABLED, false)

    fun setBlockedPackages(context: Context, packages: Set<String>) {
        prefs(context).edit().putString(KEY_BLOCKED, packages.joinToString(WINDOW_SEPARATOR)).apply()
    }

    fun getBlockedPackages(context: Context): Set<String> =
        prefs(context).getString(KEY_BLOCKED, "")
            ?.split(WINDOW_SEPARATOR)
            ?.filter { it.isNotBlank() }
            ?.toSet()
            .orEmpty()

    fun setFocusWindows(context: Context, windows: List<Pair<Int, Int>>) {
        val value = windows
            .filter { it.first in 0..23 && it.second in 0..23 }
            .joinToString(WINDOW_SEPARATOR) { "${it.first}$FIELD_SEPARATOR${it.second}" }
        prefs(context).edit().putString(KEY_WINDOWS, value).apply()
    }

    fun getFocusWindows(context: Context): List<Pair<Int, Int>> =
        prefs(context).getString(KEY_WINDOWS, "")
            ?.split(WINDOW_SEPARATOR)
            ?.mapNotNull { encoded ->
                val parts = encoded.split(FIELD_SEPARATOR)
                if (parts.size != 2) return@mapNotNull null
                val start = parts[0].toIntOrNull() ?: return@mapNotNull null
                val end = parts[1].toIntOrNull() ?: return@mapNotNull null
                if (start !in 0..23 || end !in 0..23) null else start to end
            }
            .orEmpty()

    fun setCooldownMinutes(context: Context, minutes: Int) {
        prefs(context).edit().putInt(KEY_COOLDOWN_MINUTES, minutes.coerceIn(1, 60)).apply()
    }

    fun getCooldownMinutes(context: Context): Int =
        prefs(context).getInt(KEY_COOLDOWN_MINUTES, 10).coerceIn(1, 60)

    fun clearBypass(context: Context) {
        prefs(context).edit().remove(KEY_BYPASS_UNTIL).remove(KEY_BYPASS_PACKAGE).apply()
    }

    fun allowTemporarily(context: Context, packageName: String, minutes: Int = getCooldownMinutes(context)) {
        val safeMinutes = minutes.coerceIn(1, 60)
        val until = System.currentTimeMillis() + safeMinutes * 60_000L
        prefs(context).edit()
            .putLong(KEY_BYPASS_UNTIL, until)
            .putString(KEY_BYPASS_PACKAGE, packageName)
            .apply()
    }

    fun evaluate(context: Context, packageName: String, currentMillis: Long = System.currentTimeMillis()): Decision {
        if (!isEnabled(context)) return allow()
        if (packageName.isBlank() || packageName == context.packageName) return allow()
        if (packageName !in getBlockedPackages(context)) return allow()

        val bypassPackage = prefs(context).getString(KEY_BYPASS_PACKAGE, null)
        val bypassUntil = prefs(context).getLong(KEY_BYPASS_UNTIL, 0L)
        if (bypassPackage == packageName && bypassUntil > currentMillis) return allow()
        if (bypassUntil > 0L && bypassUntil <= currentMillis) clearBypass(context)

        if (isInsideFocusWindow(getFocusWindows(context), currentMillis)) {
            val calendar = Calendar.getInstance().apply { timeInMillis = currentMillis }
            return Decision(
                blocked = true,
                label = "Nexus Focus Gate",
                message = "This app is protected during your current focus window. You can pause the gate for a few minutes when you have a real reason to open it.",
                remainingMinutes = minutesUntilNextWindowEnd(getFocusWindows(context), calendar),
            )
        }
        return allow()
    }

    private fun isInsideFocusWindow(windows: List<Pair<Int, Int>>, currentMillis: Long): Boolean {
        if (windows.isEmpty()) return false
        val hour = Calendar.getInstance().apply { timeInMillis = currentMillis }
            .get(Calendar.HOUR_OF_DAY)
        return windows.any { (start, end) ->
            if (start == end) hour == start
            else if (start < end) hour in start until end
            else hour >= start || hour < end
        }
    }

    private fun minutesUntilNextWindowEnd(windows: List<Pair<Int, Int>>, calendar: Calendar): Int {
        val nowMinute = calendar.get(Calendar.HOUR_OF_DAY) * 60 + calendar.get(Calendar.MINUTE)
        val candidates = windows.map { (start, end) ->
            val endMinute = if (start < end) end * 60 else if (nowMinute >= start * 60) (end + 24) * 60 else end * 60
            var delta = endMinute - nowMinute
            if (delta <= 0) delta += 24 * 60
            delta
        }
        return candidates.minOrNull()?.coerceAtLeast(1) ?: 0
    }

    private fun allow(): Decision = Decision(false, "", "")

    private fun prefs(context: Context) =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
}
