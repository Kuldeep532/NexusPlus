package com.nexuswavetech.nexusplus

import java.time.LocalTime

/**
 * Privacy-first launcher recommendation engine.
 *
 * This stage intentionally uses explicit user time preferences and local device
 * context only. It does not upload location, app usage, or personal history.
 */
data class NexusLauncherRecommendationRule(
    val id: String,
    val startMinute: Int,
    val endMinute: Int,
    val packageNames: List<String>,
    val label: String,
)

data class NexusLauncherContext(
    val currentMinute: Int,
    val gpsEnabled: Boolean = false,
    val vehicleStoppedNearFuelStation: Boolean = false,
)

object NexusLauncherRecommendations {
    fun recommend(
        rules: List<NexusLauncherRecommendationRule>,
        context: NexusLauncherContext,
    ): List<NexusLauncherRecommendationRule> {
        val matched = rules.filter { isWithin(it, context.currentMinute) }
        if (context.vehicleStoppedNearFuelStation) {
            return matched.sortedWith(
                compareByDescending<NexusLauncherRecommendationRule> {
                    it.packageNames.any { packageName -> packageName.contains("maps", ignoreCase = true) }
                }.thenBy { it.startMinute },
            )
        }
        if (context.gpsEnabled) {
            return matched.sortedWith(compareByDescending<NexusLauncherRecommendationRule> {
                it.packageNames.any { packageName -> packageName.contains("maps", ignoreCase = true) }
            })
        }
        return matched
    }

    fun defaultTimeRules(): List<NexusLauncherRecommendationRule> = listOf(
        NexusLauncherRecommendationRule(
            id = "morning-payments",
            startMinute = 8 * 60,
            endMinute = 10 * 60,
            packageNames = listOf("com.google.android.apps.nbu.paisa.user"),
            label = "Morning payments",
        ),
        NexusLauncherRecommendationRule(
            id = "midday-messaging",
            startMinute = 12 * 60,
            endMinute = 14 * 60,
            packageNames = listOf("com.whatsapp"),
            label = "Midday messaging",
        ),
        NexusLauncherRecommendationRule(
            id = "evening-maps",
            startMinute = 17 * 60,
            endMinute = 21 * 60,
            packageNames = listOf("com.google.android.apps.maps"),
            label = "Travel and maps",
        ),
    )

    fun currentMinute(): Int {
        val time = LocalTime.now()
        return time.hour * 60 + time.minute
    }

    private fun isWithin(rule: NexusLauncherRecommendationRule, minute: Int): Boolean {
        return if (rule.startMinute <= rule.endMinute) {
            minute in rule.startMinute..rule.endMinute
        } else {
            minute >= rule.startMinute || minute <= rule.endMinute
        }
    }
}
