package com.nexuswavetech.nexusplus

import android.app.Activity
import android.app.AlertDialog
import android.app.role.RoleManager
import android.content.Context
import android.content.Intent
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
 * Launcher work remains isolated from the existing Expo/React application entry point.
 */
class NexusLauncherActivity : Activity() {
    private lateinit var root: LinearLayout
    private lateinit var status: TextView
    private lateinit var defaultButton: TextView
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

        status = textView("Launcher status", 14f, Color.rgb(88, 88, 88)).apply { gravity = Gravity.CENTER }
        root.addView(status, fullWidthWrap(dp(2)))

        if (drawerOpen) renderDrawer() else renderHome()

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

        root.addView(textView("Simple. Private. Focused.", 17f, Color.rgb(72, 72, 72)).apply {
            gravity = Gravity.CENTER
            contentDescription = "Simple, Private, Focused"
        }, wrap(dp(8)))

        renderFocusGateCard()
        renderAssistantHub()
        renderPinnedApps()

        if (NexusLauncherPreferences.getMode(this) == NexusLauncherPreferences.MODE_APP_DRAWER_PLUS_HOME) {
            root.addView(actionButton("App Drawer", false).apply {
                contentDescription = "Open App Drawer"
                setOnClickListener { openAppDrawer() }
            }, fullWidth(dp(16)))
        }

        defaultButton = actionButton("Set as Default Launcher", false).apply {
            contentDescription = "Set Nexus Launcher as Default Launcher"
            setOnClickListener { requestHomeRole() }
        }
        root.addView(defaultButton, fullWidth(dp(12)))
    }

    private fun renderFocusGateCard() {
        val enabled = NexusLauncherFocusGate.isEnabled(this)
        val windows = NexusLauncherFocusGate.getFocusWindows(this)
        val blockedCount = NexusLauncherFocusGate.getBlockedPackages(this).size
        val cooldown = NexusLauncherFocusGate.getCooldownMinutes(this)
        val saved = NexusLauncherFocusGate.getSavedDistractionsToday(this)
        val summary = when {
            !enabled -> "Focus Gate is off"
            windows.isEmpty() -> "Focus Gate is on • set a focus window"
            else -> "Focus Gate is on • $blockedCount protected apps • $cooldown min pause"
        }

        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(18), dp(16), dp(18), dp(16))
            setBackgroundColor(Color.WHITE)
            contentDescription = "Nexus Focus Gate. $summary. Today you saved yourself $saved times."
            importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_YES
        }
        card.addView(textView("Nexus Focus Gate", 20f, Color.BLACK).apply { setTypeface(Typeface.DEFAULT, Typeface.BOLD) }, fullWidthWrap(0))
        card.addView(textView(summary, 14f, Color.rgb(82, 82, 82)), fullWidthWrap(dp(6)))
        card.addView(textView("Today: $saved distraction${if (saved == 1) "" else "s"} avoided", 13f, Color.rgb(72, 88, 77)), fullWidthWrap(dp(6)))
        card.addView(actionButton(if (enabled) "Adjust Focus Gate" else "Turn on Focus Gate", true).apply {
            contentDescription = if (enabled) "Adjust Nexus Focus Gate" else "Turn on Nexus Focus Gate"
            setOnClickListener { showFocusGateDialog() }
        }, fullWidth(dp(12)))
        root.addView(card, fullWidthWrap(dp(18)))
    }

    private fun showFocusGateDialog() {
        val packages = loadFocusCandidates()
        val blocked = NexusLauncherFocusGate.getBlockedPackages(this).toMutableSet()
        val names = packages.map { it.label }.toTypedArray()
        val checked = BooleanArray(packages.size) { packages[it].packageName in blocked }

        AlertDialog.Builder(this)
            .setTitle("Nexus Focus Gate")
            .setMultiChoiceItems(names, checked) { _, which, isChecked ->
                val pkg = packages.getOrNull(which)?.packageName ?: return@setMultiChoiceItems
                if (isChecked) blocked += pkg else blocked -= pkg
            }
            .setView(buildFocusSettingsView())
            .setPositiveButton("Save") { _, _ ->
                NexusLauncherFocusGate.setEnabled(this, blocked.isNotEmpty())
                NexusLauncherFocusGate.setBlockedPackages(this, blocked)
                if (NexusLauncherFocusGate.getFocusWindows(this).isEmpty()) {
                    NexusLauncherFocusGate.setFocusWindows(this, listOf(9 to 13))
                }
                renderLauncher()
            }
            .setNeutralButton(if (NexusLauncherFocusGate.isEnabled(this)) "Turn Off" else "Keep Off") { _, _ ->
                NexusLauncherFocusGate.setEnabled(this, false)
                renderLauncher()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun buildFocusSettingsView(): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        setPadding(dp(20), dp(12), dp(20), dp(8))
        addView(textView("Focus window and pause settings", 15f, Color.BLACK).apply { setTypeface(Typeface.DEFAULT, Typeface.BOLD) })
        val windows = NexusLauncherFocusGate.getFocusWindows(this@NexusLauncherActivity)
        val windowText = if (windows.isEmpty()) "09:00–13:00" else windows.joinToString(", ") { (s, e) -> "%02d:00–%02d:00".format(s, e) }
        addView(textView("Window: $windowText", 13f, Color.DKGRAY), fullWidthWrap(dp(4)))
        addView(textView("Pause: ${NexusLauncherFocusGate.getCooldownMinutes(this@NexusLauncherActivity)} minutes. Use the React Native Nexus Launcher settings for exact hour/cooldown controls.", 13f, Color.DKGRAY), fullWidthWrap(dp(4)))
    }

    private fun loadFocusCandidates(): List<AppEntry> = loadLaunchableApps().filterNot { app ->
        val lower = app.packageName.lowercase(Locale.getDefault())
        lower.contains("android") || lower.contains("settings") || lower.contains("phone") ||
            lower.contains("dialer") || lower.contains("contacts") || lower.contains("messag") || lower.contains("camera")
    }.take(32)

    private fun renderAssistantHub() {
        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(18), dp(16), dp(18), dp(16))
            setBackgroundColor(Color.WHITE)
            importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_YES
            contentDescription = "Nexus Assistant and essential features"
        }
        card.addView(textView("Nexus Assistant", 21f, Color.BLACK).apply {
            setTypeface(Typeface.DEFAULT, Typeface.BOLD)
            contentDescription = "Nexus Assistant"
        }, fullWidthWrap(0))
        card.addView(textView("Your assistant and key Nexus tools, available directly from Home.", 14f, Color.rgb(82, 82, 82)).apply { contentDescription = text }, fullWidthWrap(dp(6)))
        card.addView(actionButton("Ask Nexus Assistant", true).apply {
            contentDescription = "Open Nexus Assistant"
            setOnClickListener { openNexusAssistant() }
        }, fullWidth(dp(12)))
        val features = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER }
        features.addView(featureShortcut("Battery", "Battery status") { openNexusFeature("battery-status") }, compactWidth())
        features.addView(featureShortcut("Device", "Device information") { openNexusFeature("device-info") }, compactWidth())
        features.addView(featureShortcut("Reminder", "Create reminder") { openNexusFeature("create-reminder") }, compactWidth())
        card.addView(features, fullWidthWrap(dp(10)))
        root.addView(card, fullWidthWrap(dp(22)))
    }

    private fun featureShortcut(label: String, description: String, action: () -> Unit): TextView = textView(label, 13f, Color.rgb(30, 30, 30)).apply {
        gravity = Gravity.CENTER
        setPadding(dp(8), dp(12), dp(8), dp(12))
        isClickable = true
        isFocusable = true
        contentDescription = description
        setBackgroundColor(Color.rgb(240, 240, 240))
        setOnClickListener { action() }
    }

    private fun compactWidth(): LinearLayout.LayoutParams = LinearLayout.LayoutParams(0, dp(48), 1f).apply { marginEnd = dp(6) }

    private fun openNexusAssistant() {
        val intent = packageManager.getLaunchIntentForPackage(packageName) ?: return
        intent.putExtra("nexus_launcher_destination", "assistant")
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED)
        startActivity(intent)
    }

    private fun openNexusFeature(feature: String) {
        val intent = packageManager.getLaunchIntentForPackage(packageName) ?: return
        intent.putExtra("nexus_launcher_destination", feature)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED)
        startActivity(intent)
    }

    private fun renderPinnedApps() {
        val pinned = NexusLauncherPreferences.getPinnedPackages(this)
        if (pinned.isEmpty()) return
        root.addView(textView("Pinned apps", 15f, Color.rgb(72, 72, 72)).apply {
            gravity = Gravity.CENTER
            setTypeface(Typeface.DEFAULT, Typeface.BOLD)
            contentDescription = "Pinned apps"
        }, fullWidthWrap(dp(28)))
        pinned.forEach { packageName ->
            findLaunchableApp(packageName)?.let { app ->
                root.addView(createAppRow(app).apply { contentDescription = "Open pinned ${app.label}" }, fullWidth(dp(8)))
            }
        }
    }

    private fun renderDrawer() {
        root.addView(textView("App Drawer", 28f, Color.BLACK).apply {
            gravity = Gravity.CENTER
            setTypeface(Typeface.DEFAULT, Typeface.BOLD)
            contentDescription = "App Drawer"
        }, wrap(dp(24)))
        root.addView(actionButton(if (NexusLauncherPreferences.isCustomSort(this)) "Sort: Custom" else "Sort: A to Z", false).apply {
            contentDescription = if (NexusLauncherPreferences.isCustomSort(this)) "App Drawer sorted by custom order" else "App Drawer sorted A to Z"
            setOnClickListener { NexusLauncherPreferences.toggleSortMode(this@NexusLauncherActivity); renderLauncher() }
        }, fullWidth(dp(12)))
        val scroll = ScrollView(this).apply { isFillViewport = true; contentDescription = "Installed applications" }
        val list = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(0, dp(12), 0, dp(20)) }
        loadLaunchableApps().forEach { app -> list.addView(createAppRow(app), fullWidth(dp(8))) }
        scroll.addView(list)
        root.addView(scroll, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f).apply { topMargin = dp(4) })
        root.addView(actionButton("Back to Home", false).apply {
            contentDescription = "Return to Nexus Launcher home"
            setOnClickListener { drawerOpen = false; renderLauncher() }
        }, fullWidth(dp(8)))
    }

    private fun loadLaunchableApps(): List<AppEntry> {
        val manager = packageManager
        val launcherIntent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
        val apps = manager.queryIntentActivities(launcherIntent, PackageManager.MATCH_ALL).map { resolveInfo ->
            val activityInfo = resolveInfo.activityInfo
            AppEntry(
                label = resolveInfo.loadLabel(manager)?.toString()?.trim()?.ifBlank { activityInfo.packageName } ?: activityInfo.packageName,
                packageName = activityInfo.packageName,
                className = activityInfo.name,
                icon = resolveInfo.loadIcon(manager),
            )
        }.distinctBy { "${it.packageName}/${it.className}" }.filterNot { it.packageName == packageName }
        val customOrder = NexusLauncherPreferences.getCustomOrder(this)
        return if (customOrder.isEmpty()) apps.sortedBy { it.label.lowercase(Locale.getDefault()) }
        else {
            val position = customOrder.withIndex().associate { it.value to it.index }
            apps.sortedWith(compareBy<AppEntry> { position[it.packageName] ?: Int.MAX_VALUE }.thenBy { it.label.lowercase(Locale.getDefault()) })
        }
    }

    private fun findLaunchableApp(packageName: String): AppEntry? = loadLaunchableApps().firstOrNull { it.packageName == packageName }

    private fun createAppRow(app: AppEntry): TextView = textView(app.label, 17f, Color.rgb(25, 25, 25)).apply {
        gravity = Gravity.CENTER_VERTICAL
        setPadding(dp(18), 0, dp(18), 0)
        setCompoundDrawablesWithIntrinsicBounds(app.icon, null, null, null)
        compoundDrawablePadding = dp(16)
        minHeight = dp(58)
        isClickable = true
        isFocusable = true
        setBackgroundColor(Color.WHITE)
        contentDescription = "Open ${app.label}"
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
        if (!isDefaultHome()) {
            startAppActivity(app)
            return
        }
        val decision = NexusLauncherFocusGate.evaluate(this, app.packageName)
        if (decision.blocked) {
            showFocusMentor(app)
            return
        }
        NexusLauncherRecommendationEngine.recordLaunch(this, app.packageName)
        startAppActivity(app)
    }

    private fun showFocusMentor(app: AppEntry) {
        val intent = Intent(this, NexusLauncherMentorActivity::class.java).apply {
            putExtra("blocked_package", app.packageName)
            putExtra("blocked_label", app.label)
            addFlags(Intent.FLAG_ACTIVITY_NO_HISTORY)
        }
        startActivity(intent)
    }

    private fun startAppActivity(app: AppEntry) {
        val intent = Intent().apply {
            setClassName(app.packageName, app.className)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED)
        }
        runCatching { startActivity(intent) }
    }

    private fun openAppDrawer() { drawerOpen = true; renderLauncher() }

    private fun refreshStatus() {
        val isDefault = isDefaultHome()
        val modeLabel = if (NexusLauncherPreferences.getMode(this) == NexusLauncherPreferences.MODE_HOME_ONLY) "Home Screen Only" else "App Drawer + Home Screen"
        status.text = if (isDefault) "Nexus Launcher is your Home • $modeLabel" else "Nexus Launcher • Preview mode"
        status.contentDescription = status.text
        if (!drawerOpen && ::defaultButton.isInitialized) defaultButton.visibility = if (isDefault) View.GONE else View.VISIBLE
    }

    private fun requestHomeRole() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val roleManager = getSystemService(RoleManager::class.java)
            if (roleManager?.isRoleAvailable(RoleManager.ROLE_HOME) == true && !roleManager.isRoleHeld(RoleManager.ROLE_HOME)) {
                startActivityForResult(roleManager.createRequestRoleIntent(RoleManager.ROLE_HOME), REQUEST_HOME_ROLE)
                return
            }
        }
        runCatching { startActivity(Intent(Settings.ACTION_HOME_SETTINGS)) }
    }

    private fun isDefaultHome(): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val roleManager = getSystemService(RoleManager::class.java)
            if (roleManager?.isRoleAvailable(RoleManager.ROLE_HOME) == true) return roleManager.isRoleHeld(RoleManager.ROLE_HOME)
        }
        val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
        val resolve = packageManager.resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY)
        return resolve?.activityInfo?.packageName == packageName
    }

    private fun textView(value: String, size: Float, color: Int): TextView = TextView(this).apply {
        text = value; textSize = size; setTextColor(color); importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_YES
    }

    private fun actionButton(label: String, filled: Boolean): TextView = textView(label, 16f, if (filled) Color.WHITE else Color.rgb(30, 30, 30)).apply {
        gravity = Gravity.CENTER; setPadding(dp(16), 0, dp(16), 0)
        setBackgroundColor(if (filled) Color.rgb(28, 28, 28) else Color.rgb(226, 226, 226))
        isClickable = true; isFocusable = true
    }

    private fun fullWidth(topMargin: Int): LinearLayout.LayoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(58)).apply { this.topMargin = topMargin }
    private fun fullWidthWrap(topMargin: Int): LinearLayout.LayoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply { this.topMargin = topMargin }
    private fun wrap(topMargin: Int): LinearLayout.LayoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply { this.topMargin = topMargin }
    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

    data class AppEntry(val label: String, val packageName: String, val className: String, val icon: Drawable)
    companion object { private const val REQUEST_HOME_ROLE = 7102 }
}

object NexusLauncherPreferences {
    private const val PREFS = "nexus_launcher"
    private const val KEY_HOME_ENABLED = "home_enabled"
    private const val KEY_MODE = "launcher_mode"
    private const val KEY_WEATHER = "weather_enabled"
    private const val KEY_GOOGLE_SEARCH = "google_search_enabled"
    private const val KEY_SORT_CUSTOM = "sort_custom"
    private const val KEY_CUSTOM_ORDER = "custom_order"
    private const val KEY_PINNED_PACKAGES = "pinned_packages"
    const val MODE_APP_DRAWER_PLUS_HOME = "APP_DRAWER_PLUS_HOME"
    const val MODE_HOME_ONLY = "HOME_ONLY"

    fun isEnabled(context: Context): Boolean = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean(KEY_HOME_ENABLED, false)
    fun setEnabled(context: Context, value: Boolean) { context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putBoolean(KEY_HOME_ENABLED, value).apply() }
    fun getMode(context: Context): String = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_MODE, MODE_APP_DRAWER_PLUS_HOME) ?: MODE_APP_DRAWER_PLUS_HOME
    fun setMode(context: Context, value: String) { require(value == MODE_APP_DRAWER_PLUS_HOME || value == MODE_HOME_ONLY); context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY_MODE, value).apply() }
    fun isWeatherEnabled(context: Context): Boolean = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean(KEY_WEATHER, true)
    fun setWeatherEnabled(context: Context, value: Boolean) { context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putBoolean(KEY_WEATHER, value).apply() }
    fun isGoogleSearchEnabled(context: Context): Boolean = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean(KEY_GOOGLE_SEARCH, true)
    fun setGoogleSearchEnabled(context: Context, value: Boolean) { context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putBoolean(KEY_GOOGLE_SEARCH, value).apply() }
    fun isCustomSort(context: Context): Boolean = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean(KEY_SORT_CUSTOM, false)
    fun toggleSortMode(context: Context) { val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE); prefs.edit().putBoolean(KEY_SORT_CUSTOM, !prefs.getBoolean(KEY_SORT_CUSTOM, false)).apply() }
    fun getCustomOrder(context: Context): List<String> = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_CUSTOM_ORDER, null)?.split("|")?.filter { it.isNotBlank() } ?: emptyList()
    fun setCustomOrder(context: Context, packages: List<String>) { context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY_CUSTOM_ORDER, packages.distinct().joinToString("|" )).apply() }
    fun getPinnedPackages(context: Context): List<String> = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_PINNED_PACKAGES, null)?.split("|")?.filter { it.isNotBlank() } ?: emptyList()
    fun setPinnedPackages(context: Context, packages: List<String>) { context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY_PINNED_PACKAGES, packages.distinct().joinToString("|" )).apply() }
}
