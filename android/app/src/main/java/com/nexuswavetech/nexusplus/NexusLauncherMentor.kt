package com.nexuswavetech.nexusplus

import android.content.Context
import java.util.Random

/**
 * Lightweight on-device Habit & Focus Mentor for Nexus Launcher.
 * It does not depend on Nexus Plus screens, network calls, or an external AI API.
 */
object NexusLauncherMentor {
    data class Challenge(
        val prompt: String,
        val reason: String,
    )

    data class Nudge(
        val title: String,
        val body: String,
    )

    private val fallbackOptions = listOf(
        "5 मिनट शांत बैठकर धीमी साँसों पर ध्यान दें।",
        "100 कदम धीरे-धीरे टहलें और फिर वापस Home पर आएँ।",
        "एक मिनट आँखें बंद करके अपने अगले जरूरी काम का नाम मन में दोहराएँ।",
    )

    fun buildChallenge(): Challenge {
        val code = buildString {
            repeat(15) { append(Random.nextInt(0, 10)) }
        }
        return Challenge(
            prompt = "3 सेकंड में यह 15-अंकों का कोड सही टाइप करें: $code",
            reason = "यह जानबूझकर छोटा लेकिन कठिन pause है, ताकि impulse टूट सके।",
        )
    }

    fun chooseSattvicAlternative(): String = fallbackOptions[Random.nextInt(fallbackOptions.size)]

    fun progressNudge(context: Context): Nudge {
        val saved = NexusLauncherFocusGate.getSavedDistractionsToday(context)
        return when {
            saved <= 0 -> Nudge(
                "आज से शुरुआत",
                "जब भी आपने इस pause को पूरा किया, वही आपकी focus practice की शुरुआत मानी जाएगी।",
            )
            else -> Nudge(
                "आज आपकी प्रगति: $saved बार",
                "आपने आज कम-से-कम $saved बार ध्यान भटकने से खुद को रोका। इसे एक छोटे जीत-स्टreak की तरह देखें।",
            )
        }
    }
}
