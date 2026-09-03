package com.nexuswavetech.nexusplus

import android.app.Activity
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.widget.LinearLayout
import android.widget.TextView

/**
 * Launcher-only Habit & Focus Mentor interruption surface.
 * It is shown by NexusLauncherActivity and never by Nexus Plus screens.
 */
class NexusLauncherMentorActivity : Activity() {
    private lateinit var root: LinearLayout
    private lateinit var challengeText: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        render()
    }

    private fun render() {
        root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(dp(24), dp(52), dp(24), dp(32))
            setBackgroundColor(Color.rgb(248, 246, 238))
            importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_YES
        }

        val title = textView("Nexus Habit & Focus Mentor", 26f, Color.rgb(35, 48, 42)).apply {
            gravity = Gravity.CENTER
            setTypeface(Typeface.DEFAULT, Typeface.BOLD)
            contentDescription = "Nexus Habit and Focus Mentor"
        }
        root.addView(title, wrap(dp(12)))

        val challenge = NexusLauncherMentor.buildChallenge()
        challengeText = textView(challenge.prompt, 19f, Color.rgb(28, 34, 31)).apply {
            gravity = Gravity.CENTER
            setPadding(dp(8), dp(20), dp(8), dp(16))
            contentDescription = text
        }
        root.addView(challengeText, fullWidthWrap(0))

        root.addView(textView(
            "यह 3-second pause जानबूझकर कठिन है। असफल होने पर आपका focus option दिखेगा।",
            13f,
            Color.rgb(83, 91, 86),
        ).apply { gravity = Gravity.CENTER; contentDescription = text }, fullWidthWrap(dp(6)))

        root.addView(actionButton("3 सेकंड शुरू करें", true).apply {
            contentDescription = "Start three second focus challenge"
            setOnClickListener {
                NexusLauncherFocusGate.recordSavedDistraction(this@NexusLauncherMentorActivity)
                showPositiveAlternative()
            }
        }, fullWidth(dp(20)))

        val progress = NexusLauncherMentor.progressNudge(this)
        root.addView(textView(progress.title, 18f, Color.rgb(35, 48, 42)).apply {
            gravity = Gravity.CENTER
            setTypeface(Typeface.DEFAULT, Typeface.BOLD)
            contentDescription = progress.title
        }, fullWidthWrap(dp(28)))
        root.addView(textView(progress.body, 13f, Color.rgb(83, 91, 86)).apply {
            gravity = Gravity.CENTER
            contentDescription = text
        }, fullWidthWrap(dp(7)))

        root.addView(actionButton("वापस Home", false).apply {
            contentDescription = "Return to Nexus Launcher Home"
            setOnClickListener { finishAndRemoveTask() }
        }, fullWidth(dp(22)))

        setContentView(root)
    }

    private fun showPositiveAlternative() {
        root.removeAllViews()
        val title = textView("अभी इस impulse को यहीं रोकें", 24f, Color.rgb(35, 48, 42)).apply {
            gravity = Gravity.CENTER
            setTypeface(Typeface.DEFAULT, Typeface.BOLD)
            contentDescription = text
        }
        root.addView(title, fullWidthWrap(dp(20)))

        val alternative = NexusLauncherMentor.chooseSattvicAlternative()
        root.addView(textView(alternative, 18f, Color.rgb(45, 54, 49)).apply {
            gravity = Gravity.CENTER
            setPadding(dp(6), dp(8), dp(6), dp(12))
            contentDescription = text
        }, fullWidthWrap(0))

        val progress = NexusLauncherMentor.progressNudge(this)
        root.addView(textView(progress.title, 19f, Color.rgb(35, 48, 42)).apply {
            gravity = Gravity.CENTER
            setTypeface(Typeface.DEFAULT, Typeface.BOLD)
            contentDescription = progress.title
        }, fullWidthWrap(dp(18)))
        root.addView(textView(progress.body, 13f, Color.rgb(83, 91, 86)).apply {
            gravity = Gravity.CENTER
            contentDescription = text
        }, fullWidthWrap(dp(6)))

        root.addView(actionButton("Focus complete • Home पर जाएँ", true).apply {
            contentDescription = "Complete focus pause and return Home"
            setOnClickListener { finishAndRemoveTask() }
        }, fullWidth(dp(24)))
        root.addView(actionButton("वापस चुनौती पर", false).apply {
            contentDescription = "Return to focus challenge"
            setOnClickListener { render() }
        }, fullWidth(dp(10)))
    }

    private fun textView(value: String, size: Float, color: Int): TextView = TextView(this).apply {
        text = value
        textSize = size
        setTextColor(color)
        importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_YES
    }

    private fun actionButton(label: String, filled: Boolean): TextView = textView(
        label,
        16f,
        if (filled) Color.WHITE else Color.rgb(30, 40, 35),
    ).apply {
        gravity = Gravity.CENTER
        setPadding(dp(16), 0, dp(16), 0)
        setBackgroundColor(if (filled) Color.rgb(48, 79, 64) else Color.rgb(225, 230, 226))
        isClickable = true
        isFocusable = true
    }

    private fun fullWidth(topMargin: Int): LinearLayout.LayoutParams =
        LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(56)).apply { this.topMargin = topMargin }

    private fun fullWidthWrap(topMargin: Int): LinearLayout.LayoutParams =
        LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply { this.topMargin = topMargin }

    private fun wrap(topMargin: Int): LinearLayout.LayoutParams =
        LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply { this.topMargin = topMargin }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()
}
