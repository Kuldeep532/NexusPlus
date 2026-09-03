package com.nexuswavetech.nexusplus

import android.app.Activity
import android.app.role.RoleManager
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.Drawable
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.Gravity
import android.view.View
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import java.util.Locale

/**
 * Nexus Launcher: minimal native home surface with a package-backed app drawer.
 *
 * This activity stays separate from the Expo/React app entry point. Installing or
 * updating Nexus Plus never silently changes the device default launcher.
 */
class NexusLauncherActivity : Activity() {
    private lateinit var root: LinearLayout
    private lateinit var status: TextView
    private lateinit var defaultButton: TextView
    private lateinit var appDrawerButton: TextView
    private var drawerOpen = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        configureSystemUi()
        renderLauncher()
    }

    override fun onResume() {
        super.onResume()
        refreshStatus()
    }

    override fun onBackPressed() {
        if (drawerOpen) {
            drawerOpen = false
            renderLauncher()
            return
        }
        super.onBackPressed()
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
            contentDescription = if (drawerOpen) "Nexus Launcher app drawer" else "Nexus Launcher home"
        }

        status = textView("Launcher status", 14f, Color.rgb(88, 88, 88)).apply {
            gravity = Gravity.CENTER
        }
        root.addView(status, fullWidthWrap(dp(2)))

        if (drawerOpen) {
            renderDrawer()
        } else {
            renderHome()
        }

        setContentView(root)
        refreshStatus()
    }

    private fun renderHome() {
        val title = textView("Nexus Launcher", 30f, Color.BLACK).apply {
            gravity = Gravity.CENTER
            setTypeface(Typeface.DEFAULT, Typeface.BOLD)
            contentDescription = "Nexus Launcher"
        }
        root.addView(title, wrap(dp(28)))

        val subtitle = textView("Simple. Private. Focused.", 17f, Color.rgb(72, 72, 72)).apply {
            gravity = Gravity.CENTER
            contentDescription = "Simple, Private, Focused"
        }
        root.addView(subtitle, wrap(dp(8)))

        val open = actionButton("Open Nexus Plus", filled = true).apply {
            contentDescription = "Open Nexus Plus app"
            setOnClickListener { openNexusPlus() }
        }
        root.addView(open, fullWidth(dp(28)))

        val mode = NexusLauncherPreferences.getMode(this)
        if (mode == NexusLauncherPreferences.MODE_APP_DRAWER_PLUS_HOME) {
            appDrawerButton = actionButton("App Drawer", filled = false).apply {
                contentDescription = "Open App Drawer"
                setOnClickListener { openAppDrawer() }
            }
            root.addView(appDrawerButton, fullWidth(dp(12)))
        }

        defaultButton = actionButton("Set as Default Launcher", filled = false).apply {
            contentDescription = "Set Nexus Launcher as Default Launcher"
            setOnClickListener { requestHomeRole() }
        }
        root.addView(defaultButton, fullWidth(dp(12)))

        val info = textView(
            "App Drawer uses installed Android launchable apps. A to Z sorting is enabled by default; custom order is stored for the next personalization stage.",
            13f,
            Color.rgb(108, 108, 108),
        ).apply {
            gravity = Gravity.CENTER
            contentDescription = text
        }
        root.addView(info, fullWidthWrap(dp(24)))
    }

    private fun renderDrawer() {
        val heading = textView("App Drawer", 28f, Color.BLACK).apply {
            gravity = Gravity.CENTER
            setTypeface(Typeface.DEFAULT, Typeface.BOLD)
            contentDescription = "App Drawer"
        }
        root.addView(heading, wrap(dp(24)))

        val sort = actionButton(
            if (NexusLauncherPreferences.isCustomSort(this)) "Sort: Custom" else "Sort: A to Z",
            filled = false,
        ).apply {
            contentDescription = if (NexusLauncherPreferences.isCustomSort(this@NexusLauncherActivity)) {
                "App Drawer sorted by custom order"
            } else {
                "App Drawer sorted A to Z"
            }
            setOnClickListener {
                NexusLauncherPreferences.toggleSortMode(this@NexusLauncherActivity)
                renderLauncher()
            }
        }
        root.addView(sort, fullWidth(dp(12)))

        val scroll = ScrollView(this).apply {
            isFillViewport = true
            contentDescription = "Installed applications"
        }
        val list = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(0, dp(12), 0, dp(20))
        }

        loadLaunchableApps().forEach { app ->
            list.addView(createAppRow(app), fullWidth(dp(8)))
        }

        scroll.addView(list)
        root.addView(
            scroll,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                0,
                1f,
            ).apply { topMargin = dp(4) },
        )

        val back = actionButton("Back to Home", filled = false).apply {
            contentDescription = "Return to Nexus Launcher home"
            setOnClickListener {
                drawerOpen = false
                renderLauncher()
            }
        }
        root.addView(back, fullWidth(dp(8)))
    }

    private fun loadLaunchableApps(): List<AppEntry> {
        val manager = packageManager
        val launcherIntent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
        val apps = manager.queryIntentActivities(launcherIntent, PackageManager.MATCH_ALL)
            .map { resolveInfo ->
                val activityInfo = resolveInfo.activityInfo
                AppEntry(
                    label = resolveInfo.loadLabel(manager)?.toString()?.trim()
                        ?.ifBlank { activityInfo.packageName } ?: activityInfo.packageName,
                    packageName = activityInfo.packageName,
                    className = activityInfo.name,
                    icon = resolveInfo.loadIcon(manager),
                )
            }
            .distinctBy { "${it.packageName}/${it.className}" }
            .filterNot { it.packageName == packageName }

        val customOrder = NexusLauncherPreferences.getCustomOrder(this)
        return if (customOrder.isEmpty()) {
            apps.sortedBy { it.label.lowercase(Locale.getDefault()) }
        } else {
            val position = customOrder.withIndex().associate { it.value to it.index }
            apps.sortedWith(
                compareBy<AppEntry> { position[it.packageName] ?: Int.MAX_VALUE }
                    .thenBy { it.label.lowercase(Locale.getDefault()) },
            )
        }
    }

    private fun createAppRow(app: AppEntry): TextView =
        textView(app.label, 17f, Color.rgb(25, 25, 25)).apply {
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(18), 0, dp(18), 0)
            setCompoundDrawablesWithIntrinsicBounds(app.icon, null, null, null)
            compoundDrawablePadding = dp(16)
            minHeight = dp(58)
            isClickable = true
            isFocusable = true
            contentDescription = "Open ${app.label}"
            setBackgroundColor(Color.WHITE)
            setOnClickListener { launchApp(app) }
            accessibilityDelegate = object : View.AccessibilityDelegate() {
                override fun onInitializeAccessibilityNodeInfo(host: View, info: AccessibilityNodeInfo) {
                    super.onInitializeAccessibilityNodeInfo(host, info)
                    info.isClickable = true
                    info.className = TextView::class.java.name
                }
            }
        }

    private fun launchApp(app: AppEntry) {
        val intent = Intent().apply {
            setClassName(app.packageName, app.className)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED)
        }
        runCatching { startActivity(intent) }
    }

    private fun openAppDrawer() {
        drawerOpen = true
        renderLauncher()
    }

    private fun refreshStatus() {
        val isDefault = isDefaultHome()
        val mode = NexusLauncherPreferences.getMode(this)
        val modeLabel = if (mode == NexusLauncherPreferences.MODE_HOME_ONLY) {
            "Home Screen Only"
        } else {
            "App Drawer + Home Screen"
        }
        status.text = if (isDefault) {
            "Nexus Launcher is your Home • $modeLabel"
        } else {
            "Nexus Launcher • Preview mode"
        }
        status.contentDescription = status.text
        if (!drawerOpen) {
            defaultButton.visibility = if (isDefault) View.GONE else View.VISIBLE
        }
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

    data class AppEntry(
        val label: String,
        val packageName: String,
        val className: String,
        val icon: Drawable,
    )

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
    private const val KEY_SORT_CUSTOM = "sort_custom"
    private const val KEY_CUSTOM_ORDER = "custom_order"

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

    fun isCustomSort(context: Context): Boolean =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getBoolean(KEY_SORT_CUSTOM, false)

    fun toggleSortMode(context: Context) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        prefs.edit().putBoolean(KEY_SORT_CUSTOM, !prefs.getBoolean(KEY_SORT_CUSTOM, false)).apply()
    }

    fun getCustomOrder(context: Context): List<String> =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(KEY_CUSTOM_ORDER, null)
            ?.split('\u001F')
            ?.filter { it.isNotBlank() }
            ?: emptyList()

    fun setCustomOrder(context: Context, packages: List<String>) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit().putString(KEY_CUSTOM_ORDER, packages.joinToString("\u001F")).apply()
    }
}
