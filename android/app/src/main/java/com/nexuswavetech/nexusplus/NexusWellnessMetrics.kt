package com.nexuswavetech.nexusplus

import android.content.Context
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/** Local, privacy-first metrics for protection events. No network sync. */
object NexusWellnessMetrics {
    private const val PREFS = "nexus_wellness_metrics"
    private const val KEY_SCROLL_ATTEMPTS = "scroll_attempts"
    private const val KEY_BLOCK_EVENTS = "block_events"
    private const val KEY_ALTERNATIVE_SESSIONS = "alternative_sessions"
    private const val KEY_KNOWLEDGE_SESSIONS = "knowledge_sessions"
    private const val KEY_ADDICTIVE_SIGNALS = "addictive_signals"
    private const val KEY_SENSITIVE_SIGNALS = "sensitive_signals"
    private const val KEY_LAST_CLASS = "last_class"
    private const val KEY_LAST_EVENT = "last_event"

    data class Snapshot(
        val scrollAttempts: Int,
        val blockedEvents: Int,
        val alternativeSessions: Int,
        val knowledgeSessions: Int,
        val addictiveSignals: Int,
        val sensitiveSignals: Int,
        val lastClass: String,
        val lastEvent: String,
    )

    fun recordScrollAttempt(context: Context) = increment(context, KEY_SCROLL_ATTEMPTS, "scroll_attempt")
    fun recordBlockedEvent(context: Context) = increment(context, KEY_BLOCK_EVENTS, "blocked")
    fun recordAlternativeSession(context: Context) = increment(context, KEY_ALTERNATIVE_SESSIONS, "alternative")

    fun recordContentClass(context: Context, contentClass: NexusContentPatternEngine.ContentClass) {
        val key = when (contentClass) {
            NexusContentPatternEngine.ContentClass.KNOWLEDGEABLE -> KEY_KNOWLEDGE_SESSIONS
            NexusContentPatternEngine.ContentClass.ADDICTIVE -> KEY_ADDICTIVE_SIGNALS
            NexusContentPatternEngine.ContentClass.SENSITIVE -> KEY_SENSITIVE_SIGNALS
            NexusContentPatternEngine.ContentClass.UNKNOWN -> null
        }
        val prefs = prefs(context)
        val editor = prefs.edit().putString(KEY_LAST_CLASS, contentClass.name)
        if (key != null) editor.putInt(key, prefs.getInt(key, 0) + 1)
        editor.putString(KEY_LAST_EVENT, "${timestamp()}:content_${contentClass.name.lowercase(Locale.US)}").apply()
    }

    fun snapshot(context: Context): Snapshot {
        val prefs = prefs(context)
        return Snapshot(
            scrollAttempts = prefs.getInt(KEY_SCROLL_ATTEMPTS, 0),
            blockedEvents = prefs.getInt(KEY_BLOCK_EVENTS, 0),
            alternativeSessions = prefs.getInt(KEY_ALTERNATIVE_SESSIONS, 0),
            knowledgeSessions = prefs.getInt(KEY_KNOWLEDGE_SESSIONS, 0),
            addictiveSignals = prefs.getInt(KEY_ADDICTIVE_SIGNALS, 0),
            sensitiveSignals = prefs.getInt(KEY_SENSITIVE_SIGNALS, 0),
            lastClass = prefs.getString(KEY_LAST_CLASS, "UNKNOWN") ?: "UNKNOWN",
            lastEvent = prefs.getString(KEY_LAST_EVENT, "") ?: "",
        )
    }

    private fun increment(context: Context, key: String, event: String) {
        val prefs = prefs(context)
        prefs.edit()
            .putInt(key, prefs.getInt(key, 0) + 1)
            .putString(KEY_LAST_EVENT, "${timestamp()}:$event")
            .apply()
    }

    private fun timestamp(): String = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US).format(Date())

    private fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
}
