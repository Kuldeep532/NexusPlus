package com.nexuswavetech.nexusplus

import android.content.Context
import java.util.Calendar

/**
 * Nexus Launcher-only opening guard. This state is consumed by NexusLauncherActivity
 * and its native settings bridge; Nexus Plus screens do not use it.
 */
object NexusLauncherFocusGate {
    private const val PREFS = "nexus_launcher_focus_gate"
    private const val KEY_ENABLED = "enabled"
    private const val KEY_BLOCKED = "blocked_packages"
    private const val KEY_WINDOWS = "focus_windows"
    private const val KEY_COOLDOWN_MINUTES = "cooldown_minutes"
    private const val KEY_COOLDOWNS = "cooldowns"
    private const val KEY_SAVED_TODAY = "saved_today"
    private const val KEY_SAVED_DAY = "saved_day"

    private const val WINDOW_SEPARATOR = "|"
    private const val FIELD_SEPARATOR = ","
    private const val COOLDOWN_SEPARATOR = ";"

    data class Decision(
        val blocked: Boolean,
        val label: String,
        val message: String,
        val canGrantCooldown: Boolean = false,
    )

    fun setEnabled(context: Context, enabled: Boolean) {
        prefs(context).edit().putBoolean(KEY_ENABLED, enabled).apply()
    }

    fun isEnabled(context: Context): Boolean = prefs(context).getBoolean(KEY_ENABLED, false)

    fun setBlockedPackages(context: Context, packages: Set<String>) {
        prefs(context).edit().putString(KEY_BLOCKED, packages.filter { it.isNotBlank() }.distinct().joinToString(WINDOW_SEPARATOR)).apply()
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
            .distinct()
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
        prefs(context).getInt(KEY_COOLDOWN_MINUTES, 5).coerceIn(1, 60)

    fun grantCooldown(context: Context, packageName: String, now: Long = System.currentTimeMillis()) {
        if (packageName.isBlank()) return
        val until = now + getCooldownMinutes(context) * 60_000L
        val cooldowns = loadCooldowns(context).toMutableMap()
        cooldowns[packageName] = until
        saveCooldowns(context, cooldowns)
    }

    fun isCooldownActive(context: Context, packageName: String, now: Long = System.currentTimeMillis()): Boolean {
        val until = loadCooldowns(context)[packageName] ?: return false
        if (until > now) return true
        val cooldowns = loadCooldowns(context).toMutableMap()
        cooldowns.remove(packageName)
        saveCooldowns(context, cooldowns)
        return false
    }

    fun evaluate(context: Context, packageName: String, currentMillis: Long = System.currentTimeMillis()): Decision {
        if (!isEnabled(context)) return allow()
        if (packageName.isBlank() || packageName == context.packageName) return allow()
        if (packageName !in getBlockedPackages(context)) return allow()
        if (isCooldownActive(context, packageName, currentMillis)) return allow()
        if (!isInsideFocusWindow(getFocusWindows(context), currentMillis)) return allow()

        return Decision(
            blocked = true,
            label = "Nexus Focus Gate",
            message = "You chose to protect this app during your focus window.",
            canGrantCooldown = true,
        )
    }

    fun recordSavedDistraction(context: Context) {
        val prefs = prefs(context)
        val day = dayKey()
        val storedDay = prefs.getString(KEY_SAVED_DAY, null)
        val current = if (storedDay == day) prefs.getInt(KEY_SAVED_TODAY, 0) else 0
        prefs.edit()
            .putString(KEY_SAVED_DAY, day)
            .putInt(KEY_SAVED_TODAY, current + 1)
            .apply()
    }

    fun getSavedDistractionsToday(context: Context): Int {
        val prefs = prefs(context)
        return if (prefs.getString(KEY_SAVED_DAY, null) == dayKey()) {
            prefs.getInt(KEY_SAVED_TODAY, 0)
        } else {
            0
        }
    }

    private fun isInsideFocusWindow(windows: List<Pair<Int, Int>>, currentMillis: Long): Boolean {
        if (windows.isEmpty()) return false
        val hour = Calendar.getInstance().apply { timeInMillis = currentMillis }
            .get(Calendar.HOUR_OF_DAY)
        return windows.any { (start, end) ->
            when {
                start == end -> hour == start
                start < end -> hour in start until end
                else -> hour >= start || hour < end
            }
        }
    }

    private fun loadCooldowns(context: Context): Map<String, Long> =
        prefs(context).getString(KEY_COOLDOWNS, "")
            ?.split(COOLDOWN_SEPARATOR)
            ?.mapNotNull { encoded ->
                val parts = encoded.split(FIELD_SEPARATOR, limit = 2)
                if (parts.size != 2) return@mapNotNull null
                val until = parts[1].toLongOrNull() ?: return@mapNotNull null
                parts[0] to until
            }
            ?.toMap()
            .orEmpty()

    private fun saveCooldowns(context: Context, cooldowns: Map<String, Long>) {
        val value = cooldowns.entries.joinToString(COOLDOWN_SEPARATOR) { "${it.key}$FIELD_SEPARATOR${it.value}" }
        prefs(context).edit().putString(KEY_COOLDOWNS, value).apply()
    }

    private fun dayKey(): String {
        val calendar = Calendar.getInstance()
        return "${calendar.get(Calendar.YEAR)}-${calendar.get(Calendar.DAY_OF_YEAR)}"
    }

    private fun allow(): Decision = Decision(false, "", "")

    private fun prefs(context: Context) =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
}
