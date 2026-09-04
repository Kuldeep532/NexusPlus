package com.nexuswavetech.nexusplus

import android.content.Context

/**
 * Minimal local signals for the future real-time pattern detector.
 * No content leaves the device and no network/API is used here.
 */
object NexusPatternMetrics {
    private const val PREFS = "nexus_pattern_metrics"
    private const val KEY_SESSION_START = "session_start"
    private const val KEY_SCROLL_GESTURES = "scroll_gestures"
    private const val KEY_CONTENT_POSITIVE = "positive_content"
    private const val KEY_CONTENT_ADDICTIVE = "addictive_content"

    data class Snapshot(
        val sessionMinutes: Int,
        val scrollGestures: Int,
        val positiveContentSignals: Int,
        val addictiveContentSignals: Int,
    )

    fun startSession(context: Context) {
        prefs(context).edit().putLong(KEY_SESSION_START, System.currentTimeMillis()).apply()
    }

    fun recordScrollGesture(context: Context) {
        increment(context, KEY_SCROLL_GESTURES)
    }

    fun recordPositiveContentSignal(context: Context) {
        increment(context, KEY_CONTENT_POSITIVE)
    }

    fun recordAddictiveContentSignal(context: Context) {
        increment(context, KEY_CONTENT_ADDICTIVE)
    }

    fun snapshot(context: Context, now: Long = System.currentTimeMillis()): Snapshot {
        val p = prefs(context)
        val start = p.getLong(KEY_SESSION_START, 0L)
        val minutes = if (start > 0L && now >= start) ((now - start) / 60_000L).toInt() else 0
        return Snapshot(
            sessionMinutes = minutes,
            scrollGestures = p.getInt(KEY_SCROLL_GESTURES, 0),
            positiveContentSignals = p.getInt(KEY_CONTENT_POSITIVE, 0),
            addictiveContentSignals = p.getInt(KEY_CONTENT_ADDICTIVE, 0),
        )
    }

    private fun increment(context: Context, key: String) {
        val p = prefs(context)
        p.edit().putInt(key, p.getInt(key, 0) + 1).apply()
    }

    private fun prefs(context: Context) =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
}
