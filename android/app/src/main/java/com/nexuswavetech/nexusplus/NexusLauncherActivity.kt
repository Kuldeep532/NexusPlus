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
import android.widget.LinearLayout
import android.widget.TextView

/** Privacy-first launcher home with an explicit first-run protection gate. */
class NexusLauncherActivity : Activity() {
    private lateinit var root: LinearLayout
    private lateinit var status: TextView
    private lateinit var defaultButton: TextView
    private lateinit var protectionStatus: TextView
    private lateinit var protectionButton: TextView

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
            setPadding(dp(24), dp(48), dp(24), dp(32))
            setBackgroundColor(Color.rgb(248, 248, 248))
            importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_YES
        }

        status = textView("Launcher status", 14f, Color.rgb(92, 92, 92)).apply { gravity = Gravity.CENTER }
        root.addView(status, fullWidthWrap(dp(4)))

        val title = textView("Nexus Launcher", 32f, Color.BLACK).apply {
            gravity = Gravity.CENTER
            setTypeface(Typeface.DEFAULT, Typeface.BOLD)
            contentDescription = "Nexus Launcher"
        }
        root.addView(title, wrap(dp(28)))

        val mission = textView(
            "Creating a safe environment for everyone, especially women.",
            18f,
            Color.rgb(50, 50, 50),
        ).apply {
            gravity = Gravity.CENTER
            contentDescription = text
        }
        root.addView(mission, fullWidthWrap(dp(16)))

        protectionStatus = textView("Protection status", 15f, Color.rgb(70, 70, 70)).apply {
            gravity = Gravity.CENTER
            contentDescription = text
        }
        root.addView(protectionStatus, fullWidthWrap(dp(16)))

        protectionButton = actionButton("Enable Safe Environment", filled = true).apply {
            contentDescription = "Enable safe environment protection"
            setOnClickListener { continueProtectionSetup() }
        }
        root.addView(protectionButton, fullWidth(dp(12)))

        val open = actionButton("Open Nexus Plus", filled = false).apply {
            contentDescription = "Open Nexus Plus"
            setOnClickListener { openNexusPlus() }
        }
        root.addView(open, fullWidth(dp(12)))

        defaultButton = actionButton("Set as Default Launcher", filled = false).apply {
            contentDescription = "Set Nexus Launcher as Default Launcher"
            setOnClickListener { requestHomeRole() }
        }
        root.addView(defaultButton, fullWidth(dp(12)))

        val info = textView(
            "Protection uses explicit Android permissions and blocks only high-confidence adult domains. Normal and educational content is not routed through a separate internet VPN path.",
            13f,
            Color.rgb(112, 112, 112),
        ).apply {
            gravity = Gravity.CENTER
            contentDescription = text
        }
        root.addView(info, fullWidthWrap(dp(24)))

        setContentView(root)
        refreshStatus()
    }

    private fun refreshStatus() {
        val isDefault = isDefaultHome()
        status.text = if (isDefault) "Nexus Launcher is your Home" else "Nexus Launcher • Preview mode"
        defaultButton.visibility = if (isDefault) View.GONE else View.VISIBLE

        when (NexusProtectionOnboarding.nextStep(this)) {
            NexusProtectionOnboarding.Step.ACCESSIBILITY -> {
                protectionStatus.text = "Safe environment: Accessibility setup required"
                protectionButton.text = "Enable Accessibility Protection"
                protectionButton.visibility = View.VISIBLE
            }
            NexusProtectionOnboarding.Step.VPN -> {
                protectionStatus.text = "Safe environment: VPN permission required"
                protectionButton.text = "Enable Content Protection"
                protectionButton.visibility = View.VISIBLE
            }
            NexusProtectionOnboarding.Step.READY -> {
                protectionStatus.text = "Safe environment protection is ready"
                protectionButton.text = "Protection Enabled"
                protectionButton.visibility = View.GONE
            }
        }
    }

    private fun continueProtectionSetup() {
        NexusProtectionOnboarding.markAcknowledged(this)
        when (NexusProtectionOnboarding.nextStep(this)) {
            NexusProtectionOnboarding.Step.ACCESSIBILITY -> NexusProtectionOnboarding.openAccessibility(this)
            NexusProtectionOnboarding.Step.VPN -> {
                val intent = NexusProtectionOnboarding.prepareVpn(this)
                if (intent != null) startActivityForResult(intent, REQUEST_VPN_CONSENT)
            }
            NexusProtectionOnboarding.Step.READY -> Unit
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQUEST_VPN_CONSENT && resultCode == RESULT_OK) {
            NexusVpnPolicy.setConsent(this, true)
        }
        refreshStatus()
    }

    private fun requestHomeRole() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val roleManager = getSystemService(RoleManager::class.java)
            if (roleManager?.isRoleAvailable(RoleManager.ROLE_HOME) == true &&
                !roleManager.isRoleHeld(RoleManager.ROLE_HOME)
            ) {
                startActivityForResult(roleManager.createRequestRoleIntent(RoleManager.ROLE_HOME), REQUEST_HOME_ROLE)
                return
            }
        }
        runCatching { startActivity(Intent(Settings.ACTION_HOME_SETTINGS)) }
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
        val intent = packageManager.getLaunchIntentForPackage(packageName)
        if (intent != null) {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED)
            startActivity(intent)
        }
    }

    private fun textView(value: String, size: Float, color: Int): TextView = TextView(this).apply {
        text = value
        textSize = size
        setTextColor(color)
    }

    private fun actionButton(label: String, filled: Boolean): TextView = textView(
        label,
        16f,
        if (filled) Color.WHITE else Color.rgb(30, 30, 30),
    ).apply {
        gravity = Gravity.CENTER
        setPadding(dp(16), 0, dp(16), 0)
        setBackgroundColor(if (filled) Color.rgb(28, 28, 28) else Color.rgb(226, 226, 226))
    }

    private fun fullWidth(topMargin: Int): LinearLayout.LayoutParams =
        LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(52)).apply { this.topMargin = topMargin }

    private fun fullWidthWrap(topMargin: Int): LinearLayout.LayoutParams =
        LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply { this.topMargin = topMargin }

    private fun wrap(topMargin: Int): LinearLayout.LayoutParams =
        LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply { this.topMargin = topMargin }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

    companion object {
        private const val REQUEST_HOME_ROLE = 7102
        private const val REQUEST_VPN_CONSENT = 7103
    }
}

object NexusLauncherPreferences {
    private const val PREFS = "nexus_launcher"
    private const val KEY_HOME_ENABLED = "home_enabled"
    private const val KEY_MODE = "launcher_mode"
    private const val KEY_WEATHER = "weather_enabled"
    private const val KEY_GOOGLE_SEARCH = "google_search_enabled"

    fun isEnabled(context: Context): Boolean = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean(KEY_HOME_ENABLED, false)
    fun setEnabled(context: Context, value: Boolean) { context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putBoolean(KEY_HOME_ENABLED, value).apply() }
    fun getMode(context: Context): String = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_MODE, "APP_DRAWER_PLUS_HOME") ?: "APP_DRAWER_PLUS_HOME"
    fun setMode(context: Context, value: String) { require(value == "APP_DRAWER_PLUS_HOME" || value == "HOME_ONLY"); context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY_MODE, value).apply() }
    fun isWeatherEnabled(context: Context): Boolean = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean(KEY_WEATHER, true)
    fun setWeatherEnabled(context: Context, value: Boolean) { context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putBoolean(KEY_WEATHER, value).apply() }
    fun isGoogleSearchEnabled(context: Context): Boolean = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean(KEY_GOOGLE_SEARCH, true)
    fun setGoogleSearchEnabled(context: Context, value: Boolean) { context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putBoolean(KEY_GOOGLE_SEARCH, value).apply() }
}
