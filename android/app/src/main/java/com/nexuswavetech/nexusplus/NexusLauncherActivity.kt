package com.nexuswavetech.nexusplus

import android.app.Activity
import android.app.role.RoleManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.Typeface
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.Gravity
import android.view.View
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.LinearLayout
import android.widget.TextView

/**
 * Nexus Launcher: minimal native home surface.
 *
 * This activity stays separate from the Expo/React app entry point. Installing or
 * updating Nexus Plus never silently changes the device default launcher.
 */
class NexusLauncherActivity : Activity() {
    private lateinit var root: LinearLayout
    private lateinit var status: TextView
    private lateinit var defaultButton: TextView
    private lateinit var appDrawerButton: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        configureSystemUi()
        renderLauncher()
    }

    override fun onResume() {
        super.onResume()
        refreshStatus()
    }

    private fun configureSystemUi() {
        window.statusBarColor = Color.TRANSPARENT
        window.navigationBarColor = Color.TRANSPARENT
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE or
                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            )
    }

    private fun renderLauncher() {
        root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(dp(24), dp(44), dp(24), dp(28))
            setBackgroundColor(Color.rgb(248, 248, 248))
            importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_YES
            contentDescription = "Nexus Launcher home"
        }

        status = textView("Launcher status", 14f, Color.rgb(88, 88, 88)).apply {
            gravity = Gravity.CENTER
            importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_YES
        }
        root.addView(status, fullWidthWrap(dp(2)))

        val title = textView("Nexus Launcher", 30f, Color.BLACK).apply {
            gravity = Gravity.CENTER
            setTypeface(Typeface.DEFAULT, Typeface.BOLD)
            importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_YES
            contentDescription = "Nexus Launcher"
        }
        root.addView(title, wrap(dp(28)))

        val subtitle = textView("Simple. Private. Focused.", 17f, Color.rgb(72, 72, 72)).apply {
            gravity = Gravity.CENTER
            importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_YES
            contentDescription = "Simple, Private, Focused"
        }
        root.addView(subtitle, wrap(dp(8)))

        val open = actionButton("Open Nexus Plus", filled = true).apply {
            contentDescription = "Open Nexus Plus app"
            setOnClickListener { openNexusPlus() }
        }
        root.addView(open, fullWidth(dp(28)))

        appDrawerButton = actionButton("App Drawer", filled = false).apply {
            contentDescription = "Open App Drawer"
            setOnClickListener { openAppDrawer() }
        }
        root.addView(appDrawerButton, fullWidth(dp(12)))

        defaultButton = actionButton("Set as Default Launcher", filled = false).apply {
            contentDescription = "Set Nexus Launcher as Default Launcher"
            setOnClickListener { requestHomeRole() }
        }
        root.addView(defaultButton, fullWidth(dp(12)))

        val info = textView(
            "Launcher settings, app search, A to Z sorting, weather and personalization are added in later stages.",
            13f,
            Color.rgb(108, 108, 108),
        ).apply {
            gravity = Gravity.CENTER
            contentDescription = text
            importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_YES
        }
        root.addView(info, fullWidthWrap(dp(24)))

        setContentView(root)
        refreshStatus()
    }

    private fun refreshStatus() {
        val isDefault = isDefaultHome()
        val mode = NexusLauncherPreferences.getMode(this)
        status.text = if (isDefault) {
            when (mode) {
                NexusLauncherPreferences.MODE_HOME_ONLY -> "Nexus Launcher is your Home • Home Screen Only"
                else -> "Nexus Launcher is your Home • App Drawer + Home Screen"
            }
        } else {
            "Nexus Launcher • Preview mode"
        }
        status.contentDescription = status.text
        defaultButton.visibility = if (isDefault) View.GONE else View.VISIBLE
        appDrawerButton.visibility = if (mode == NexusLauncherPreferences.MODE_HOME_ONLY) View.GONE else View.VISIBLE
    }

    private fun requestHomeRole() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val roleManager = getSystemService(RoleManager::class.java)
            if (roleManager?.isRoleAvailable(RoleManager.ROLE_HOME) == true &&
                !roleManager.isRoleHeld(RoleManager.ROLE_HOME)
            ) {
                startActivityForResult(
                    roleManager.createRequestRoleIntent(RoleManager.ROLE_HOME),
                    REQUEST_HOME_ROLE,
                )
                return
            }
        }

        runCatching {
            startActivity(Intent(Settings.ACTION_HOME_SETTINGS))
        }
    }

    private fun isDefaultHome(): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val roleManager = getSystemService(RoleManager::class.java)
            if (roleManager?.isRoleAvailable(RoleManager.ROLE_HOME) == true) {
                return roleManager.isRoleHeld(RoleManager.ROLE_HOME)
            }
        }

        val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
        val resolve = packageManager.resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY)
        return resolve?.activityInfo?.packageName == packageName
    }

    private fun openNexusPlus() {
        val intent = packageManager.getLaunchIntentForPackage(packageName) ?: return
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED)
        startActivity(intent)
    }

    private fun openAppDrawer() {
        // Stage 2 uses the launcher surface as the entry point. A real package-backed
        // drawer is introduced next, keeping launch behavior centralized in this activity.
        status.text = "App Drawer is ready for the next launcher stage"
        status.contentDescription = status.text
    }

    private fun textView(value: String, size: Float, color: Int): TextView =
        TextView(this).apply {
            text = value
            textSize = size
            setTextColor(color)
            importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_YES
        }

    private fun actionButton(label: String, filled: Boolean): TextView =
        textView(label, 16f, if (filled) Color.WHITE else Color.rgb(30, 30, 30)).apply {
            gravity = Gravity.CENTER
            setPadding(dp(16), 0, dp(16), 0)
            setBackgroundColor(if (filled) Color.rgb(28, 28, 28) else Color.rgb(226, 226, 226))
            isClickable = true
            isFocusable = true
            accessibilityDelegate = object : View.AccessibilityDelegate() {
                override fun onInitializeAccessibilityNodeInfo(host: View, info: AccessibilityNodeInfo) {
                    super.onInitializeAccessibilityNodeInfo(host, info)
                    info.isClickable = true
                }
            }
        }

    private fun fullWidth(topMargin: Int): LinearLayout.LayoutParams =
        LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(52)).apply {
            this.topMargin = topMargin
        }

    private fun fullWidthWrap(topMargin: Int): LinearLayout.LayoutParams =
        LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply {
            this.topMargin = topMargin
        }

    private fun wrap(topMargin: Int): LinearLayout.LayoutParams =
        LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply {
            this.topMargin = topMargin
        }

    private fun dp(value: Int): Int =
        (value * resources.displayMetrics.density).toInt()

    companion object {
        private const val REQUEST_HOME_ROLE = 7102
    }
}

object NexusLauncherPreferences {
    private const val PREFS = "nexus_launcher"
    private const val KEY_HOME_ENABLED = "home_enabled"
    private const val KEY_MODE = "launcher_mode"
    private const val KEY_WEATHER = "weather_enabled"
    private const val KEY_GOOGLE_SEARCH = "google_search_enabled"

    const val MODE_APP_DRAWER_PLUS_HOME = "APP_DRAWER_PLUS_HOME"
    const val MODE_HOME_ONLY = "HOME_ONLY"

    fun isEnabled(context: Context): Boolean =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getBoolean(KEY_HOME_ENABLED, false)

    fun setEnabled(context: Context, value: Boolean) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit().putBoolean(KEY_HOME_ENABLED, value).apply()
    }

    fun getMode(context: Context): String =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(KEY_MODE, MODE_APP_DRAWER_PLUS_HOME) ?: MODE_APP_DRAWER_PLUS_HOME

    fun setMode(context: Context, value: String) {
        require(value == MODE_APP_DRAWER_PLUS_HOME || value == MODE_HOME_ONLY)
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