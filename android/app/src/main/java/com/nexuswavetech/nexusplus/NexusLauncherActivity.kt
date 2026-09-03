package com.nexuswavetech.nexusplus

import android.app.Activity
import android.app.role.RoleManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.provider.Settings

/**
 * Stage 1 foundation for Nexus Launcher.
 *
 * This activity is intentionally separate from MainActivity so installing/updating
 * Nexus Plus does not make the launcher the default automatically. The user must
 * explicitly request the HOME role through the system UI.
 */
class NexusLauncherActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        requestHomeRoleIfNeeded()
        renderLauncherShell()
    }

    private fun requestHomeRoleIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val roleManager = getSystemService(RoleManager::class.java)
            if (!roleManager.isRoleHeld(RoleManager.ROLE_HOME) &&
                roleManager.isRoleAvailable(RoleManager.ROLE_HOME) &&
                roleManager.isRoleVisible(RoleManager.ROLE_HOME)
            ) {
                startActivityForResult(
                    roleManager.createRequestRoleIntent(RoleManager.ROLE_HOME),
                    REQUEST_HOME_ROLE,
                )
                return
            }
        }

        // Fallback for OEMs/older Android versions: open the system default-app screen.
        if (!isDefaultHome()) {
            runCatching {
                startActivity(Intent(Settings.ACTION_HOME_SETTINGS))
            }
        }
    }

    private fun renderLauncherShell() {
        // UI is added in later stages. Keeping a native shell here makes the launcher
        // entry point stable while preserving the existing Expo/React application.
    }

    private fun isDefaultHome(): Boolean {
        val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
        val resolve = packageManager.resolveActivity(intent, 0) ?: return false
        return resolve.activityInfo?.packageName == packageName
    }

    companion object {
        private const val REQUEST_HOME_ROLE = 7001
    }
}

object NexusLauncherPreferences {
    private const val PREFS = "nexus_launcher"
    private const val KEY_HOME_ENABLED = "home_enabled"
    private const val KEY_MODE = "launcher_mode"
    private const val KEY_WEATHER = "weather_enabled"
    private const val KEY_GOOGLE_SEARCH = "google_search_enabled"

    fun isEnabled(context: Context): Boolean =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getBoolean(KEY_HOME_ENABLED, false)

    fun setEnabled(context: Context, value: Boolean) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit().putBoolean(KEY_HOME_ENABLED, value).apply()
    }

    fun getMode(context: Context): String =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(KEY_MODE, "APP_DRAWER_PLUS_HOME") ?: "APP_DRAWER_PLUS_HOME"

    fun setMode(context: Context, value: String) {
        require(value == "APP_DRAWER_PLUS_HOME" || value == "HOME_ONLY")
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit().putString(KEY_MODE, value).apply()
    }

    fun isWeatherEnabled(context: Context): Boolean =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getBoolean(KEY_WEATHER, true)

    fun setWeatherEnabled(context: Context, value: Boolean) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit().putBoolean(KEY_WEATHER, value).apply()
    }

    fun isGoogleSearchEnabled(context: Context): Boolean =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getBoolean(KEY_GOOGLE_SEARCH, true)

    fun setGoogleSearchEnabled(context: Context, value: Boolean) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit().putBoolean(KEY_GOOGLE_SEARCH, value).apply()
    }
}
