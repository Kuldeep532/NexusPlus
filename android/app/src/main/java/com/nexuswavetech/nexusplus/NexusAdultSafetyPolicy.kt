package com.nexuswavetech.nexusplus

import java.util.Locale

/** Conservative adult-content policy with an explicit safe-context allow path. */
object NexusAdultSafetyPolicy {
    val highRiskTextSignals: Set<String> = setOf(
        "porn", "pornography", "xxx", "explicit sexual",
        "sex video", "sex videos", "adult video", "adult videos", "nsfw",
        "erotic", "nude", "nudity", "hentai", "sexual image", "sexual images",
        "live sex", "cam sex", "porn site", "adult site",
    )

    val safeContextSignals: Set<String> = setOf(
        "medical", "health", "healthcare", "gynecology", "gynaecology", "urology",
        "sexual health", "contraception", "reproductive health", "clinical",
        "doctor", "hospital", "patient information", "patient education", "ayushman",
        "anatomy", "physiology", "textbook", "course", "lecture", "research", "study",
        "education", "educational", "university", "college", "school",
    )

    private val highRiskPhrases = highRiskTextSignals.map(::normalize).filter(String::isNotBlank)
    private val safePhrases = safeContextSignals.map(::normalize).filter(String::isNotBlank)

    fun isProtectedText(text: String): Boolean {
        val normalized = normalize(text)
        if (normalized.isBlank() || containsSafeContext(normalized)) return false
        return highRiskPhrases.any(normalized::contains)
    }

    fun isSafeContext(text: String): Boolean = containsSafeContext(normalize(text))

    fun isAlwaysAllowedPackage(packageName: String): Boolean =
        NexusProtectionPolicy.isEssentialPackage(packageName)

    private fun containsSafeContext(normalized: String): Boolean =
        safePhrases.any(normalized::contains)

    private fun normalize(text: String): String =
        text.lowercase(Locale.ROOT)
            .replace(Regex("\\s+"), " ")
            .trim()
}
