package com.nexuswavetech.nexusplus

import android.content.Context
import android.location.Location
import java.util.Calendar
import kotlin.math.max

/**
 * Privacy-first, on-device recommendation engine.
 *
 * No network, account, analytics, or external API is used here. Recommendations are
 * based on local time preferences, lightweight launch history, and optional local context.
 */
object NexusLauncherRecommendationEngine {
    private const val PREFS = "nexus_launcher_recommendations"
    private const val KEY_HISTORY = "launch_history"
    private const val MAX_HISTORY = 200

    data class Candidate(
        val packageName: String,
        val label: String,
        val score: Double,
        val reason: String,
    )

    enum class ContextSignal { NONE, LOCATION_AVAILABLE, MOVING, STATIONARY }

    fun recordLaunch(context: Context, packageName: String, atMillis: Long = System.currentTimeMillis()) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val entry = "$atMillis,$packageName"
        val history = prefs.getString(KEY_HISTORY, "")
            ?.split("|")
            ?.filter { it.isNotBlank() }
            .orEmpty()
        val updated = (history + entry).takeLast(MAX_HISTORY)
        prefs.edit().putString(KEY_HISTORY, updated.joinToString("|")).apply()
    }

    fun recommend(
        context: Context,
        apps: List<NexusLauncherActivity.AppEntry>,
        currentTimeMillis: Long = System.currentTimeMillis(),
        location: Location? = null,
        preferredPackages: Map<IntRange, Set<String>> = emptyMap(),
        limit: Int = 4,
    ): List<Candidate> {
        if (apps.isEmpty()) return emptyList()
        val calendar = Calendar.getInstance().apply { timeInMillis = currentTimeMillis }
        val hour = calendar.get(Calendar.HOUR_OF_DAY)
        val signal = contextSignal(location)
        val history = loadHistory(context)
        val preferred = preferredPackages.entries
            .firstOrNull { hour in it.key }
            ?.value
            .orEmpty()

        return apps
            .map { app ->
                val preferenceScore = if (app.packageName in preferred) 40.0 else 0.0
                val learnedScore = learnedTimeScore(history, app.packageName, hour)
                val contextScore = contextScore(app.packageName, signal)
                val recencyScore = recencyScore(history, app.packageName, currentTimeMillis)
                val score = preferenceScore + learnedScore + contextScore + recencyScore
                Candidate(app.packageName, app.label, score, buildReason(preferenceScore, learnedScore, contextScore))
            }
            .filter { it.score > 0.0 }
            .sortedByDescending { it.score }
            .take(limit)
    }

    private data class LaunchEvent(val time: Long, val packageName: String)

    private fun loadHistory(context: Context): List<LaunchEvent> =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(KEY_HISTORY, "")
            ?.split("|")
            ?.mapNotNull { value ->
                val parts = value.split(',', limit = 2)
                if (parts.size != 2) return@mapNotNull null
                val time = parts[0].toLongOrNull() ?: return@mapNotNull null
                LaunchEvent(time, parts[1])
            }
            .orEmpty()

    private fun learnedTimeScore(history: List<LaunchEvent>, packageName: String, hour: Int): Double {
        val relevant = history.filter { it.packageName == packageName }
        if (relevant.isEmpty()) return 0.0
        var score = 0.0
        relevant.forEach {
            val pastHour = Calendar.getInstance().apply { timeInMillis = it.time }.get(Calendar.HOUR_OF_DAY)
            val distance = circularHourDistance(hour, pastHour)
            score += max(0.0, 18.0 - distance * 3.0)
        }
        return score.coerceAtMost(36.0)
    }

    private fun recencyScore(history: List<LaunchEvent>, packageName: String, now: Long): Double {
        val latest = history.lastOrNull { it.packageName == packageName }?.time ?: return 0.0
        val ageHours = ((now - latest).coerceAtLeast(0L) / 3_600_000.0)
        return when {
            ageHours <= 2 -> 2.0
            ageHours <= 12 -> 4.0
            ageHours <= 48 -> 2.0
            else -> 0.0
        }
    }

    private fun contextSignal(location: Location?): ContextSignal {
        if (location == null) return ContextSignal.NONE
        val speed = location.speed
        return when {
            speed >= 3.0f -> ContextSignal.MOVING
            location.hasAccuracy() && location.accuracy <= 100f -> ContextSignal.STATIONARY
            else -> ContextSignal.LOCATION_AVAILABLE
        }
    }

    private fun contextScore(packageName: String, signal: ContextSignal): Double {
        val lower = packageName.lowercase()
        return when (signal) {
            ContextSignal.MOVING -> when {
                lower.contains("maps") || lower.contains("navigation") -> 28.0
                lower.contains("uber") || lower.contains("ola") -> 18.0
                else -> 0.0
            }
            ContextSignal.STATIONARY, ContextSignal.LOCATION_AVAILABLE -> when {
                lower.contains("maps") || lower.contains("navigation") -> 10.0
                else -> 0.0
            }
            ContextSignal.NONE -> 0.0
        }
    }

    private fun circularHourDistance(a: Int, b: Int): Int {
        val diff = kotlin.math.abs(a - b)
        return minOf(diff, 24 - diff)
    }

    private fun buildReason(preference: Double, learned: Double, context: Double): String = when {
        context > 0 && learned > 0 -> "Suggested for your time and current context"
        context > 0 -> "Suggested for your current context"
        preference > 0 -> "Suggested from your time preference"
        learned > 0 -> "Suggested from your local usage pattern"
        else -> "Suggested"
    }
}
