package com.nexuswavetech.nexusplus

import android.app.Activity
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.view.Gravity
import android.widget.LinearLayout
import android.widget.TextView

/** Settings entry point owned by Nexus Launcher, separate from the Nexus Plus settings screen. */
class NexusLauncherSettingsActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(24), dp(44), dp(24), dp(28))
            setBackgroundColor(Color.rgb(248, 248, 248))
            addView(text("Nexus Launcher Settings", 28f, Color.BLACK, true))
            addView(text("Launcher-only controls", 16f, Color.DKGRAY, false), wrap(dp(8)))
            addView(text("Focus Gate, Habit & Focus Mentor, Home Memory, Home layout, App Drawer and launcher theme behavior are controlled here.", 14f, Color.DKGRAY, false), wrap(dp(20)))
            addView(action("Focus Gate", "Configure protected apps, focus windows and cooldown."), fullWidth(dp(14)))
            addView(action("Habit & Focus Mentor", "Review the launcher-only distraction interruption experience."), fullWidth(dp(8)))
            addView(action("Home Memory", "Manage local quick intents shown on Home."), fullWidth(dp(8)))
            addView(action("Home Layout & App Drawer", "Switch between Home Screen Only and App Drawer + Home Screen."), fullWidth(dp(8)))
        })
    }

    private fun action(title: String, description: String): TextView = text("$title\n$description", 16f, Color.rgb(30, 30, 30), true).apply {
        gravity = Gravity.CENTER_VERTICAL
        setPadding(dp(18), 0, dp(18), 0)
        setBackgroundColor(Color.WHITE)
        isClickable = true
        isFocusable = true
        contentDescription = "$title. $description"
    }

    private fun text(value: String, size: Float, color: Int, bold: Boolean): TextView = TextView(this).apply {
        text = value
        textSize = size
        setTextColor(color)
        if (bold) setTypeface(Typeface.DEFAULT, Typeface.BOLD)
        importantForAccessibility = android.view.View.IMPORTANT_FOR_ACCESSIBILITY_YES
    }

    private fun fullWidth(topMargin: Int) = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(64)).apply { this.topMargin = topMargin }
    private fun wrap(topMargin: Int) = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply { this.topMargin = topMargin }
    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()
}
