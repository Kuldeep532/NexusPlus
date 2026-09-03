package com.nexuswavetech.nexusplus

import android.app.role.RoleManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import java.util.Calendar

/**
 * Local protection policy shared by the Nexus Launcher and Nexus Plus UI.
 *
 * This class is deliberately launcher-agnostic: callers may ask for a decision
 * even when Nexus Launcher is not the current HOME app. The launcher-only guard
 * remains available through evaluateFromLauncher(), while Nexus Plus can use the
 * same persisted policy through evaluateInNexusPlus().
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
    private const val KEY_MENTOR_PASSES = "mentor_passes"
    private const val KEY_ACTIVE_SESSION_STARTS = "active_session_starts"

    private const val SESSION_TIMEOUT_MILLIS = 30 * 60_000L
    private const val WINDOW_SEPARATOR = "|"
    private const val FIELD_SEPARATOR = ","
    private const val COOLDOWN_SEPARATOR = ";"

    data class Decision(
        val blocked: Boolean,
        val label: String,
        val message: String,
        val canGrantCooldown: Boolean = false,
        val remainingMinutes: Int = 0,
    )

    fun isLauncherDefault(context: Context): Boolean {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
            val role = context.getSystemService(RoleManager::class.java)
            if (role?.isRoleAvailable(RoleManager.ROLE_HOME) == true) {
                return role.isRoleHeld(RoleManager.ROLE_HOME)
            }
        }
        val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
        return context.packageManager
            .resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY)
            ?.activityInfo
            ?.packageName == context.packageName
    }

    fun setEnabled(context: Context, enabled: Boolean) {
        prefs(context).edit().putBoolean(KEY_ENABLED, enabled).apply()
    }

    fun isEnabled(context: Context): Boolean =
        prefs(context).getBoolean(KEY_ENABLED, false)

    fun setBlockedPackages(context: Context, packages: Set<String>) {
        val normalized = packages
            .map(String::trim)
            .filter(String::isNotBlank)
            .distinct()
            .take(100)
        prefs(context).edit()
            .putString(KEY_BLOCKED, normalized.joinToString(WINDOW_SEPARATOR))
            .apply()
    }

    fun getBlockedPackages(context: Context): Set<String> =
        prefs(context)
            .getString(KEY_BLOCKED, "")
            ?.split(WINDOW_SEPARATOR)
            ?.map(String::trim)
            ?.filter(String::isNotBlank)
            ?.toSet()
            .orEmpty()

    fun setFocusWindows(context: Context, windows: List<Pair<Int, Int>>) {
        val normalized = windows
            .filter { it.first in 0..23 && it.second in 0..23 }
            .distinct()
        prefs(context).edit()
            .putString(
                KEY_WINDOWS,
                normalized.joinToString(WINDOW_SEPARATOR) { "${it.first}$FIELD_SEPARATOR${it.second}" },
            )
            .apply()
    }

    fun getFocusWindows(context: Context): List<Pair<Int, Int>> =
        prefs(context)
            .getString(KEY_WINDOWS, "")
            ?.split(WINDOW_SEPARATOR)
            ?.mapNotNull { entry ->
                val parts = entry.split(FIELD_SEPARATOR)
                if (parts.size != 2) return@mapNotNull null
                val start = parts[0].toIntOrNull()
                val end = parts[1].toIntOrNull()
                if (start != null && end != null && start in 0..23 && end in 0..23) {
                    start to end
                } else {
                    null
                }
            }
            .orEmpty()

    fun setCooldownMinutes(context: Context, minutes: Int) {
        prefs(context).edit()
            .putInt(KEY_COOLDOWN_MINUTES, minutes.coerceIn(1, 60))
            .apply()
    }

    fun getCooldownMinutes(context: Context): Int =
        prefs(context).getInt(KEY_COOLDOWN_MINUTES, 5).coerceIn(1, 60)

    fun grantCooldown(
        context: Context,
        packageName: String,
        now: Long = System.currentTimeMillis(),
    ) {
        if (packageName.isBlank()) return
        val cooldowns = loadCooldowns(context).toMutableMap()
        cooldowns[packageName] = now + getCooldownMinutes(context) * 60_000L
        saveCooldowns(context, cooldowns)
    }

    fun allowTemporarily(
        context: Context,
        packageName: String,
        now: Long = System.currentTimeMillis(),
    ) = grantCooldown(context, packageName, now)

    fun isCooldownActive(
        context: Context,
        packageName: String,
        now: Long = System.currentTimeMillis(),
    ): Boolean {
        val until = loadCooldowns(context)[packageName] ?: return false
        if (until > now) return true

        val cleaned = loadCooldowns(context).toMutableMap()
        cleaned.remove(packageName)
        saveCooldowns(context, cleaned)
        return false
    }

    /** Existing launcher behaviour: only protect when Nexus Launcher is HOME. */
    fun evaluateFromLauncher(
        context: Context,
        packageName: String,
        currentMillis: Long = System.currentTimeMillis(),
    ): Decision = evaluateInternal(
        context = context,
        packageName = packageName,
        currentMillis = currentMillis,
        requireLauncherDefault = true,
    )

    /** New Nexus Plus behaviour: policy works even when another launcher is HOME. */
    fun evaluateInNexusPlus(
        context: Context,
        packageName: String,
        currentMillis: Long = System.currentTimeMillis(),
    ): Decision = evaluateInternal(
        context = context,
        packageName = packageName,
        currentMillis = currentMillis,
        requireLauncherDefault = false,
    )

    /** Backward-compatible entry point used by the launcher. */
    fun evaluate(
        context: Context,
        packageName: String,
        currentMillis: Long = System.currentTimeMillis(),
    ): Decision = evaluateFromLauncher(context, packageName, currentMillis)

    fun startProtectedSession(
        context: Context,
        packageName: String,
        now: Long = System.currentTimeMillis(),
    ) {
        if (packageName.isBlank()) return
        val sessions = loadSessions(context).toMutableMap()
        sessions[packageName] = now
        saveSessions(context, sessions)
    }

    fun finishProtectedSessionAndCheck(
        context: Context,
        packageName: String,
        now: Long = System.currentTimeMillis(),
    ): Boolean {
        val sessions = loadSessions(context).toMutableMap()
        val started = sessions.remove(packageName) ?: return false
        saveSessions(context, sessions)
        return now - started >= SESSION_TIMEOUT_MILLIS
    }

    fun recordMentorPass(context: Context, packageName: String) {
        val preferences = prefs(context)
        val day = dayKey()
        val existing = preferences.getString(KEY_MENTOR_PASSES, "")
            ?.split("|")
            ?.filter { it.isNotBlank() }
            ?.filter { it.startsWith("$day,") }
            .orEmpty()
        val next = (existing + "$day,$packageName").takeLast(200)
        preferences.edit().putString(KEY_MENTOR_PASSES, next.joinToString("|")).apply()
    }

    fun recordSavedDistraction(context: Context) {
        val preferences = prefs(context)
        val day = dayKey()
        val current = if (preferences.getString(KEY_SAVED_DAY, null) == day) {
            preferences.getInt(KEY_SAVED_TODAY, 0)
        } else {
            0
        }
        preferences.edit()
            .putString(KEY_SAVED_DAY, day)
            .putInt(KEY_SAVED_TODAY, current + 1)
            .apply()
    }

    fun getSavedDistractionsToday(context: Context): Int {
        val preferences = prefs(context)
        return if (preferences.getString(KEY_SAVED_DAY, null) == dayKey()) {
            preferences.getInt(KEY_SAVED_TODAY, 0)
        } else {
            0
        }
    }

    private fun evaluateInternal(
        context: Context,
        packageName: String,
        currentMillis: Long,
        requireLauncherDefault: Boolean,
    ): Decision {
        if (requireLauncherDefault && !isLauncherDefault(context)) return allow()
        if (!isEnabled(context) || packageName.isBlank() || packageName == context.packageName) {
            return allow()
        }
        if (packageName !in getBlockedPackages(context)) return allow()
        if (isCooldownActive(context, packageName, currentMillis)) return allow()
        if (!isInsideFocusWindow(getFocusWindows(context), currentMillis)) return allow()

        return Decision(
            blocked = true,
            label = "Nexus Focus Gate",
            message = "This app is protected during your current focus window.",
            canGrantCooldown = true,
            remainingMinutes = remainingMinutesInFocusWindow(getFocusWindows(context), currentMillis),
        )
    }

    private fun isInsideFocusWindow(windows: List<Pair<Int, Int>>, now: Long): Boolean {
        if (windows.isEmpty()) return false
        val hour = Calendar.getInstance().apply { timeInMillis = now }.get(Calendar.HOUR_OF_DAY)
        return windows.any { (start, end) ->
            when {
                start == end -> hour == start
                start < end -> hour in start until end
                else -> hour >= start || hour < end
            }
        }
    }

    private fun remainingMinutesInFocusWindow(windows: List<Pair<Int, Int>>, now: Long): Int {
        val calendar = Calendar.getInstance().apply { timeInMillis = now }
        val totalMinutes = calendar.get(Calendar.HOUR_OF_DAY) * 60 + calendar.get(Calendar.MINUTE)
        val window = windows.firstOrNull { isInsideFocusWindow(listOf(it), now) } ?: return 0
        val end = window.second * 60
        return (
            if (window.first < window.second) {
                end - totalMinutes
            } else if (totalMinutes < end) {
                end - totalMinutes
            } else {
                1440 - totalMinutes + end
            }
        ).coerceAtLeast(0)
    }

    private fun loadCooldowns(context: Context): Map<String, Long> =
        prefs(context)
            .getString(KEY_COOLDOWNS, "")
            ?.split(COOLDOWN_SEPARATOR)
            ?.mapNotNull { entry ->
                val parts = entry.split(FIELD_SEPARATOR, limit = 2)
                if (parts.size != 2) return@mapNotNull null
                val until = parts[1].toLongOrNull() ?: return@mapNotNull null
                parts[0] to until
            }
            ?.toMap()
            .orEmpty()

    private fun saveCooldowns(context: Context, values: Map<String, Long>) {
        prefs(context).edit()
            .putString(
                KEY_COOLDOWNS,
                values.entries.joinToString(COOLDOWN_SEPARATOR) { "${it.key}$FIELD_SEPARATOR${it.value}" },
            )
            .apply()
    }

    private fun loadSessions(context: Context): Map<String, Long> =
        prefs(context)
            .getString(KEY_ACTIVE_SESSION_STARTS, "")
            ?.split(COOLDOWN_SEPARATOR)
            ?.mapNotNull { entry ->
                val parts = entry.split(FIELD_SEPARATOR, limit = 2)
                if (parts.size != 2) return@mapNotNull null
                val started = parts[1].toLongOrNull() ?: return@mapNotNull null
                parts[0] to started
            }
            ?.toMap()
            .orEmpty()

    private fun saveSessions(context: Context, values: Map<String, Long>) {
        prefs(context).edit()
            .putString(
                KEY_ACTIVE_SESSION_STARTS,
                values.entries.joinToString(COOLDOWN_SEPARATOR) { "${it.key}$FIELD_SEPARATOR${it.value}" },
            )
            .apply()
    }

    private fun dayKey(): String {
        val calendar = Calendar.getInstance()
        return "${calendar.get(Calendar.YEAR)}-${calendar.get(Calendar.DAY_OF_YEAR)}"
    }

    private fun allow(): Decision = Decision(blocked = false, label = "", message = "")

    private fun prefs(context: Context) =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
}
