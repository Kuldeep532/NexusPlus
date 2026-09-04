package com.nexuswavetech.nexusplus

import android.app.role.RoleManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import java.util.Calendar

/** Local protection policy shared by Nexus Launcher and Nexus Plus UI. */
object NexusLauncherFocusGate {
    private const val PREFS = "nexus_launcher_focus_gate"
    private const val KEY_ENABLED = "enabled"
    private const val KEY_CONSENT = "protection_consent"
    private const val KEY_BLOCKED = "blocked_packages"
    private const val KEY_WINDOWS = "focus_windows"
    private const val KEY_COOLDOWN_MINUTES = "cooldown_minutes"
    private const val KEY_COOLDOWNS = "cooldowns"
    private const val KEY_LOCKOUTS = "lockouts"
    private const val KEY_SAVED_TODAY = "saved_today"
    private const val KEY_SAVED_DAY = "saved_day"
    private const val KEY_MENTOR_PASSES = "mentor_passes"
    private const val KEY_ACTIVE_SESSION_STARTS = "active_session_starts"

    private const val SESSION_TIMEOUT_MILLIS = 30 * 60_000L
    private const val TWENTY_FOUR_HOURS_MILLIS = 24 * 60 * 60_000L
    private const val WINDOW_SEPARATOR = "|"
    private const val FIELD_SEPARATOR = ","
    private const val COOLDOWN_SEPARATOR = ";"

    private val ESSENTIAL_PACKAGE_MARKERS = setOf(
        "android.settings", "com.android.settings", "com.google.android.settings",
        "com.google.android.dialer", "com.android.dialer", "com.google.android.contacts",
        "com.android.contacts", "com.google.android.apps.messaging", "com.android.mms",
        "com.android.camera", "com.google.android.apps.camera",
        "com.google.android.apps.nbu.paisa.user", "com.phonepe.app", "net.one97.paytm",
        "com.whatsapp", "in.gov.uidai", "com.app.ayushman", "com.nic.app",
    )

    val DEFAULT_PROTECTED_PACKAGES: Set<String> = setOf(
        "com.instagram.android", "com.facebook.katana", "com.zhiliaoapp.musically",
    )

    data class Decision(
        val blocked: Boolean,
        val label: String,
        val message: String,
        val canGrantCooldown: Boolean = false,
        val remainingMinutes: Int = 0,
        val lockedUntil: Long = 0L,
    )

    fun hasProtectionConsent(context: Context): Boolean = prefs(context).getBoolean(KEY_CONSENT, false)

    fun grantProtectionConsent(context: Context) {
        prefs(context).edit().putBoolean(KEY_CONSENT, true).putBoolean(KEY_ENABLED, true).apply()
    }

    fun isLauncherDefault(context: Context): Boolean {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
            val role = context.getSystemService(RoleManager::class.java)
            if (role?.isRoleAvailable(RoleManager.ROLE_HOME) == true) return role.isRoleHeld(RoleManager.ROLE_HOME)
        }
        val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
        return context.packageManager.resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY)
            ?.activityInfo?.packageName == context.packageName
    }

    fun setEnabled(context: Context, enabled: Boolean) {
        if (enabled) grantProtectionConsent(context)
    }

    fun isEnabled(context: Context): Boolean = hasProtectionConsent(context) && prefs(context).getBoolean(KEY_ENABLED, false)

    fun setBlockedPackages(context: Context, packages: Set<String>) {
        val normalized = (packages + DEFAULT_PROTECTED_PACKAGES)
            .map(String::trim).filter(String::isNotBlank).distinct().filterNot(::isEssentialPackage).take(100)
        prefs(context).edit().putString(KEY_BLOCKED, normalized.joinToString(WINDOW_SEPARATOR)).apply()
    }

    fun getBlockedPackages(context: Context): Set<String> =
        (prefs(context).getString(KEY_BLOCKED, "")?.split(WINDOW_SEPARATOR)?.map(String::trim)
            ?.filter(String::isNotBlank)?.toSet().orEmpty() + DEFAULT_PROTECTED_PACKAGES)
            .filterNot(::isEssentialPackage).toSet()

    fun setFocusWindows(context: Context, windows: List<Pair<Int, Int>>) {
        prefs(context).edit().putString(
            KEY_WINDOWS,
            windows.filter { it.first in 0..23 && it.second in 0..23 }.distinct()
                .joinToString(WINDOW_SEPARATOR) { "${it.first}$FIELD_SEPARATOR${it.second}" },
        ).apply()
    }

    fun getFocusWindows(context: Context): List<Pair<Int, Int>> =
        prefs(context).getString(KEY_WINDOWS, "")?.split(WINDOW_SEPARATOR)?.mapNotNull { entry ->
            val parts = entry.split(FIELD_SEPARATOR)
            if (parts.size != 2) return@mapNotNull null
            val start = parts[0].toIntOrNull(); val end = parts[1].toIntOrNull()
            if (start != null && end != null && start in 0..23 && end in 0..23) start to end else null
        }.orEmpty()

    fun setCooldownMinutes(context: Context, minutes: Int) =
        prefs(context).edit().putInt(KEY_COOLDOWN_MINUTES, minutes.coerceIn(1, 60)).apply()

    fun getCooldownMinutes(context: Context): Int = prefs(context).getInt(KEY_COOLDOWN_MINUTES, 5).coerceIn(1, 60)

    fun grantCooldown(context: Context, packageName: String, now: Long = System.currentTimeMillis()) {
        if (packageName.isBlank() || isEssentialPackage(packageName)) return
        val cooldowns = loadCooldowns(context).toMutableMap(); cooldowns[packageName] = now + getCooldownMinutes(context) * 60_000L
        saveCooldowns(context, cooldowns)
    }

    fun allowTemporarily(context: Context, packageName: String, now: Long = System.currentTimeMillis()) = grantCooldown(context, packageName, now)

    fun isCooldownActive(context: Context, packageName: String, now: Long = System.currentTimeMillis()): Boolean {
        val until = loadCooldowns(context)[packageName] ?: return false
        if (until > now) return true
        val cleaned = loadCooldowns(context).toMutableMap(); cleaned.remove(packageName); saveCooldowns(context, cleaned); return false
    }

    /** Creates a local 24-hour lockout after a protected-app session is classified as overuse. */
    fun applyTwentyFourHourLock(context: Context, packageName: String, now: Long = System.currentTimeMillis()) {
        if (packageName.isBlank() || isEssentialPackage(packageName)) return
        val lockouts = loadLongMap(context, KEY_LOCKOUTS).toMutableMap()
        lockouts[packageName] = now + TWENTY_FOUR_HOURS_MILLIS
        saveLongMap(context, KEY_LOCKOUTS, lockouts)
        recordBlockedEvent(context)
    }

    fun isLockedForTwentyFourHours(context: Context, packageName: String, now: Long = System.currentTimeMillis()): Boolean {
        if (isEssentialPackage(packageName)) return false
        val until = loadLongMap(context, KEY_LOCKOUTS)[packageName] ?: return false
        if (until > now) return true
        val cleaned = loadLongMap(context, KEY_LOCKOUTS).toMutableMap(); cleaned.remove(packageName); saveLongMap(context, KEY_LOCKOUTS, cleaned); return false
    }

    fun evaluateFromLauncher(context: Context, packageName: String, currentMillis: Long = System.currentTimeMillis()): Decision =
        evaluateInternal(context, packageName, currentMillis, requireLauncherDefault = true)

    fun evaluateInNexusPlus(context: Context, packageName: String, currentMillis: Long = System.currentTimeMillis()): Decision =
        evaluateInternal(context, packageName, currentMillis, requireLauncherDefault = false)

    fun evaluate(context: Context, packageName: String, currentMillis: Long = System.currentTimeMillis()): Decision =
        evaluateFromLauncher(context, packageName, currentMillis)

    fun startProtectedSession(context: Context, packageName: String, now: Long = System.currentTimeMillis()) {
        if (packageName.isBlank() || isEssentialPackage(packageName)) return
        val sessions = loadLongMap(context, KEY_ACTIVE_SESSION_STARTS).toMutableMap(); sessions[packageName] = now; saveLongMap(context, KEY_ACTIVE_SESSION_STARTS, sessions)
    }

    fun finishProtectedSessionAndCheck(context: Context, packageName: String, now: Long = System.currentTimeMillis()): Boolean {
        val sessions = loadLongMap(context, KEY_ACTIVE_SESSION_STARTS).toMutableMap()
        val started = sessions.remove(packageName) ?: return false
        saveLongMap(context, KEY_ACTIVE_SESSION_STARTS, sessions)
        val overuse = now - started >= SESSION_TIMEOUT_MILLIS
        if (overuse) applyTwentyFourHourLock(context, packageName, now)
        return overuse
    }

    fun recordMentorPass(context: Context, packageName: String) {
        val preferences = prefs(context); val day = dayKey()
        val existing = preferences.getString(KEY_MENTOR_PASSES, "")?.split("|")?.filter { it.isNotBlank() }?.filter { it.startsWith("$day,") }.orEmpty()
        preferences.edit().putString(KEY_MENTOR_PASSES, (existing + "$day,$packageName").takeLast(200).joinToString("|")).apply()
    }

    fun recordSavedDistraction(context: Context) {
        val preferences = prefs(context); val day = dayKey()
        val current = if (preferences.getString(KEY_SAVED_DAY, null) == day) preferences.getInt(KEY_SAVED_TODAY, 0) else 0
        preferences.edit().putString(KEY_SAVED_DAY, day).putInt(KEY_SAVED_TODAY, current + 1).apply()
    }

    fun getSavedDistractionsToday(context: Context): Int = if (prefs(context).getString(KEY_SAVED_DAY, null) == dayKey()) prefs(context).getInt(KEY_SAVED_TODAY, 0) else 0

    fun recordBlockedEvent(context: Context) = NexusWellnessMetrics.recordBlockedEvent(context)

    private fun evaluateInternal(context: Context, packageName: String, currentMillis: Long, requireLauncherDefault: Boolean): Decision {
        if (requireLauncherDefault && !isLauncherDefault(context)) return allow()
        if (!hasProtectionConsent(context) || !isEnabled(context)) return allow()
        if (packageName.isBlank() || packageName == context.packageName || isEssentialPackage(packageName)) return allow()
        val lockedUntil = loadLongMap(context, KEY_LOCKOUTS)[packageName] ?: 0L
        if (lockedUntil > currentMillis) return Decision(true, "Nexus Focus Gate", "This protected app is locked for 24 hours after an overuse interruption.", false, 0, lockedUntil)
        if (packageName !in getBlockedPackages(context)) return allow()
        if (isCooldownActive(context, packageName, currentMillis)) return allow()
        if (!isInsideFocusWindow(getFocusWindows(context), currentMillis)) return allow()
        return Decision(true, "Nexus Focus Gate", "This app is protected during your current focus window.", true, remainingMinutesInFocusWindow(getFocusWindows(context), currentMillis))
    }

    private fun isEssentialPackage(packageName: String): Boolean =
        NexusProtectionPolicy.isEssentialPackage(packageName) || ESSENTIAL_PACKAGE_MARKERS.any { packageName == it || packageName.startsWith("$it.") }

    private fun isInsideFocusWindow(windows: List<Pair<Int, Int>>, now: Long): Boolean {
        if (windows.isEmpty()) return false
        val hour = Calendar.getInstance().apply { timeInMillis = now }.get(Calendar.HOUR_OF_DAY)
        return windows.any { (start, end) -> when { start == end -> hour == start; start < end -> hour in start until end; else -> hour >= start || hour < end } }
    }

    private fun remainingMinutesInFocusWindow(windows: List<Pair<Int, Int>>, now: Long): Int {
        val calendar = Calendar.getInstance().apply { timeInMillis = now }
        val total = calendar.get(Calendar.HOUR_OF_DAY) * 60 + calendar.get(Calendar.MINUTE)
        val window = windows.firstOrNull { isInsideFocusWindow(listOf(it), now) } ?: return 0
        val end = window.second * 60
        return (if (window.first < window.second) end - total else if (total < end) end - total else 1440 - total + end).coerceAtLeast(0)
    }

    private fun loadCooldowns(context: Context): Map<String, Long> = loadLongMap(context, KEY_COOLDOWNS)

    private fun saveCooldowns(context: Context, values: Map<String, Long>) = saveLongMap(context, KEY_COOLDOWNS, values)

    private fun loadLongMap(context: Context, key: String): Map<String, Long> =
        prefs(context).getString(key, "")?.split(COOLDOWN_SEPARATOR)?.mapNotNull { entry ->
            val parts = entry.split(FIELD_SEPARATOR, limit = 2); if (parts.size != 2) return@mapNotNull null
            val value = parts[1].toLongOrNull() ?: return@mapNotNull null; parts[0] to value
        }?.toMap().orEmpty()

    private fun saveLongMap(context: Context, key: String, values: Map<String, Long>) =
        prefs(context).edit().putString(key, values.entries.joinToString(COOLDOWN_SEPARATOR) { "${it.key}$FIELD_SEPARATOR${it.value}" }).apply()

    private fun dayKey(): String { val calendar = Calendar.getInstance(); return "${calendar.get(Calendar.YEAR)}-${calendar.get(Calendar.DAY_OF_YEAR)}" }

    private fun allow(): Decision = Decision(false, "", "")

    private fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
}
