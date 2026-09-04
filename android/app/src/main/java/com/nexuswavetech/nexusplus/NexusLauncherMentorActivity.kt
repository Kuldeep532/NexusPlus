package com.nexuswavetech.nexusplus

import android.app.Activity
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.os.CountDownTimer
import android.text.InputType
import android.view.Gravity
import android.view.View
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import java.security.SecureRandom

/** Launcher-only Habit & Focus Mentor interruption surface. */
class NexusLauncherMentorActivity : Activity() {
    private var timer: CountDownTimer? = null
    private var resolved = false
    private lateinit var root: LinearLayout
    private lateinit var input: EditText
    private lateinit var countdown: TextView
    private lateinit var code: String

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val pkg = intent.getStringExtra(EXTRA_PACKAGE).orEmpty()
        if (pkg.isBlank() || !NexusLauncherFocusGate.isLauncherDefault(this)) {
            finish()
            return
        }
        render()
    }

    override fun onDestroy() {
        timer?.cancel()
        super.onDestroy()
    }

    private fun render() {
        val label = intent.getStringExtra(EXTRA_APP_LABEL) ?: "this app"
        code = buildString(15) {
            val random = SecureRandom()
            repeat(15) { append(random.nextInt(10)) }
        }
        root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(dp(24), dp(52), dp(24), dp(32))
            setBackgroundColor(Color.rgb(248, 246, 238))
            importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_YES
            contentDescription = "Nexus Habit and Focus Mentor"
        }
        root.addView(textView("Nexus Habit & Focus Mentor", 26f, Color.rgb(35, 48, 42)).apply {
            gravity = Gravity.CENTER
            setTypeface(Typeface.DEFAULT, Typeface.BOLD)
        }, wrap(dp(12)))
        root.addView(textView(
            "Nexus Launcher paused $label to interrupt an automatic scrolling habit.",
            16f, Color.rgb(70, 70, 70)
        ).apply {
            gravity = Gravity.CENTER
            contentDescription = text
        }, fullWidthWrap(dp(10)))
        root.addView(textView(
            "This fast challenge is intentionally impractical. You may choose a positive activity instead.",
            15f, Color.rgb(45, 45, 45)
        ).apply {
            gravity = Gravity.CENTER
            contentDescription = text
        }, fullWidthWrap(dp(24)))
        root.addView(textView("Type 15 digits in 3 seconds", 18f, Color.BLACK).apply {
            gravity = Gravity.CENTER
            setTypeface(Typeface.DEFAULT, Typeface.BOLD)
            contentDescription = "Fast three second challenge: type fifteen digits"
        }, fullWidthWrap(dp(8)))
        root.addView(textView(code, 24f, Color.BLACK).apply {
            gravity = Gravity.CENTER
            setTypeface(Typeface.MONOSPACE, Typeface.BOLD)
            contentDescription = "Challenge code"
        }, fullWidthWrap(dp(4)))
        countdown = textView("3.0 seconds", 18f, Color.rgb(160, 30, 30)).apply {
            gravity = Gravity.CENTER
            setTypeface(Typeface.DEFAULT, Typeface.BOLD)
        }
        root.addView(countdown, fullWidthWrap(dp(10)))
        input = EditText(this).apply {
            inputType = InputType.TYPE_CLASS_NUMBER
            hint = "Enter the code"
            textSize = 18f
            isSingleLine = true
            contentDescription = "Enter the fifteen digit challenge code"
            importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_YES
            setTextIsSelectable(false)
            setOnLongClickListener { true }
            customSelectionActionModeCallback = object : android.view.ActionMode.Callback {
                override fun onCreateActionMode(mode: android.view.ActionMode, menu: android.view.Menu) = false
                override fun onPrepareActionMode(mode: android.view.ActionMode, menu: android.view.Menu) = false
                override fun onActionItemClicked(mode: android.view.ActionMode, item: android.view.MenuItem) = false
                override fun onDestroyActionMode(mode: android.view.ActionMode) = Unit
            }
        }
        root.addView(input, fullWidth(dp(18)))
        root.addView(actionButton("3 सेकंड शुरू करें", true).apply {
            contentDescription = "Start three second focus challenge"
            setOnClickListener { startChallenge() }
        }, fullWidth(dp(20)))
        root.addView(textView(
            "आज: ${NexusLauncherFocusGate.getSavedDistractionsToday(this)} distraction attempts redirected.",
            14f, Color.rgb(70, 88, 75)
        ).apply {
            gravity = Gravity.CENTER
            contentDescription = text
        }, fullWidthWrap(dp(22)))
        setContentView(root)
        input.requestFocus()
    }

    private fun startChallenge() {
        if (timer != null) return
        input.isEnabled = true
        timer = object : CountDownTimer(3000L, 100L) {
            override fun onTick(ms: Long) {
                countdown.text = "%.1f seconds".format(ms / 1000.0)
            }
            override fun onFinish() {
                countdown.text = "Time ended"
                input.isEnabled = false
                timer = null
                resolveAfterFailure()
            }
        }.start()
    }

    private fun resolveAfterFailure() {
        if (resolved) return
        resolved = true
        NexusLauncherFocusGate.recordSavedDistraction(this)
        NexusWellnessMetrics.recordBlockedEvent(this)
        showPositiveAlternative()
    }

    private fun showPositiveAlternative() {
        root.removeAllViews()
        root.addView(textView("अभी इस impulse को यहीं रोकें", 24f, Color.rgb(35, 48, 42)).apply {
            gravity = Gravity.CENTER
            setTypeface(Typeface.DEFAULT, Typeface.BOLD)
        }, fullWidthWrap(dp(20)))
        root.addView(textView(NexusLauncherMentor.chooseSattvicAlternative(), 18f, Color.rgb(45, 54, 49)).apply {
            gravity = Gravity.CENTER
            setPadding(dp(6), dp(8), dp(6), dp(12))
            contentDescription = text
        }, fullWidthWrap(0))
        val progress = NexusLauncherMentor.progressNudge(this)
        root.addView(textView(progress.title, 19f, Color.rgb(35, 48, 42)).apply {
            gravity = Gravity.CENTER
            setTypeface(Typeface.DEFAULT, Typeface.BOLD)
            contentDescription = text
        }, fullWidthWrap(dp(18)))
        root.addView(textView(progress.body, 13f, Color.rgb(83, 91, 86)).apply {
            gravity = Gravity.CENTER
            contentDescription = text
        }, fullWidthWrap(dp(7)))
        spiritualChoices().forEach { choice ->
            root.addView(actionButton(choice.first, false).apply {
                contentDescription = choice.second
                setOnClickListener {
                    NexusWellnessMetrics.recordAlternativeSession(this@NexusLauncherMentorActivity)
                    finishAndRemoveTask()
                }
            }, fullWidth(dp(10)))
        }
        root.addView(actionButton("Focus complete • Home पर जाएँ", true).apply {
            contentDescription = "Complete focus pause and return Home"
            setOnClickListener {
                NexusWellnessMetrics.recordAlternativeSession(this@NexusLauncherMentorActivity)
                finishAndRemoveTask()
            }
        }, fullWidth(dp(22)))
    }

    private fun spiritualChoices() = listOf(
        "5 मिनट ध्यान" to "Five minute mindful breathing or prayer",
        "100 कदम mindful walk" to "Walk one hundred calm steps",
        "भगवद गीता reflection" to "Read a short Bhagavad Gita passage and reflect",
        "कृतज्ञता के 3 बिंदु" to "Think of three things you are grateful for",
    )

    private fun textView(value: String, size: Float, color: Int) = TextView(this).apply {
        text = value
        textSize = size
        setTextColor(color)
        importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_YES
    }

    private fun actionButton(label: String, filled: Boolean) = textView(
        label, 16f, if (filled) Color.WHITE else Color.rgb(30, 40, 35)
    ).apply {
        gravity = Gravity.CENTER
        setPadding(dp(16), 0, dp(16), 0)
        setBackgroundColor(if (filled) Color.rgb(48, 79, 64) else Color.rgb(225, 230, 226))
        isClickable = true
        isFocusable = true
    }

    private fun fullWidth(m: Int) = LinearLayout.LayoutParams(-1, dp(56)).apply { topMargin = m }
    private fun fullWidthWrap(m: Int) = LinearLayout.LayoutParams(-1, -2).apply { topMargin = m }
    private fun wrap(m: Int) = LinearLayout.LayoutParams(-2, -2).apply { topMargin = m }
    private fun dp(v: Int) = (v * resources.displayMetrics.density).toInt()

    companion object {
        const val EXTRA_APP_LABEL = "mentor_app_label"
        const val EXTRA_PACKAGE = "mentor_package"
    }
}
