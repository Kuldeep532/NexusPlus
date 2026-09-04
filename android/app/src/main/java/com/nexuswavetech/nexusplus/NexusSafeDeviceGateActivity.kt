package com.nexuswavetech.nexusplus

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

/** First-run safety gate. Protected Nexus features remain locked until setup is complete. */
class NexusSafeDeviceGateActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        render()
    }

    override fun onResume() {
        super.onResume()
        if (::root.isInitialized && NexusSafeDeviceGate.isProtectedShellReady(this)) {
            finish()
        }
    }

    private lateinit var root: LinearLayout

    private fun render() {
        root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(dp(24), dp(56), dp(24), dp(36))
            setBackgroundColor(Color.rgb(248, 246, 238))
            importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_YES
        }

        root.addView(text("Nexus Safe Device Setup", 28f, Color.rgb(35, 48, 42), true), wrap(dp(12)))
        root.addView(text(
            "Nexus Plus is designed to provide a safer digital environment. Before protected Nexus features are unlocked, please allow the Nexus Safety Accessibility Service.",
            16f, Color.rgb(70, 70, 70), false,
        ), fullWidthWrap(dp(14)))
        root.addView(text(
            "Purpose: inspect supported on-screen context locally and help interrupt adult or strongly addictive content patterns. Essential apps such as medical, payments, phone, messaging and vehicle-related workflows are not intended to be blocked by this safety gate.",
            14f, Color.rgb(70, 70, 70), false,
        ), fullWidthWrap(dp(20)))
        root.addView(text(
            "Privacy: the service is user-enabled by Android system settings. Nexus Plus does not silently enable accessibility or bypass the system permission screen.",
            14f, Color.rgb(70, 70, 70), false,
        ), fullWidthWrap(dp(24)))

        val allow = Button(this).apply {
            text = "Please allow • Nexus Safety Accessibility Service"
            contentDescription = "Please allow Nexus Safety Accessibility Service in Android Accessibility settings"
            isAllCaps = false
            setOnClickListener { openAccessibilitySettings() }
        }
        root.addView(allow, fullWidth(dp(12)))

        val status = TextView(this).apply {
            text = statusText()
            textSize = 14f
            setTextColor(Color.rgb(48, 79, 64))
            gravity = Gravity.CENTER
            contentDescription = text
        }
        root.addView(status, fullWidthWrap(dp(18)))

        val uninstall = Button(this).apply {
            text = "Do not continue • Uninstall Nexus Plus"
            contentDescription = "Do not continue and uninstall Nexus Plus"
            isAllCaps = false
            setOnClickListener { requestUninstall() }
        }
        root.addView(uninstall, fullWidth(dp(12)))

        root.addView(text(
            "Nexus Plus will not unlock protected experiences until the required safety setup is completed.",
            13f, Color.rgb(90, 90, 90), false,
        ), fullWidthWrap(dp(18)))

        setContentView(root)
    }

    private fun statusText(): String =
        if (NexusSafeDeviceGate.isAccessibilityServiceEnabled(this)) {
            "Safety service: enabled"
        } else {
            "Safety service: not enabled yet"
        }

    private fun openAccessibilitySettings() {
        startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
    }

    private fun requestUninstall() {
        val intent = Intent(Intent.ACTION_DELETE).apply {
            data = Uri.parse("package:$packageName")
        }
        startActivity(intent)
    }

    private fun text(value: String, size: Float, color: Int, bold: Boolean): TextView =
        TextView(this).apply {
            text = value
            textSize = size
            setTextColor(color)
            gravity = Gravity.CENTER
            importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_YES
            if (bold) setTypeface(typeface, android.graphics.Typeface.BOLD)
        }

    private fun fullWidth(margin: Int) =
        LinearLayout.LayoutParams(-1, dp(56)).apply { topMargin = margin }

    private fun fullWidthWrap(margin: Int) =
        LinearLayout.LayoutParams(-1, -2).apply { topMargin = margin }

    private fun wrap(margin: Int) =
        LinearLayout.LayoutParams(-2, -2).apply { topMargin = margin }

    private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()
}
