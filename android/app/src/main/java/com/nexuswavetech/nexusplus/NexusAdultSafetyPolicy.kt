package com.nexuswavetech.nexusplus

/** Conservative adult-content safety policy for the local content classifier. */
object NexusAdultSafetyPolicy {
    val highRiskTextSignals: Set<String> = setOf(
        "porn", "pornography", "xxx", "explicit sexual", "sexual content",
        "sex video", "sex videos", "adult video", "adult videos", "nsfw",
        "erotic", "nude", "nudity", "hentai", "sexual image", "sexual images",
        "live sex", "cam sex", "porn site", "adult site",
    )

    val safeContextSignals: Set<String> = setOf(
        "medical", "health", "gynecology", "urology", "sexual health",
        "contraception", "reproductive health", "clinical", "doctor", "hospital",
        "patient information", "ayushman",
    )

    fun isProtectedText(text: String): Boolean {
        val normalized = text.trim().lowercase()
        if (normalized.isBlank()) return false
        if (safeContextSignals.any(normalized::contains)) return false
        return highRiskTextSignals.any(normalized::contains)
    }

    fun isAlwaysAllowedPackage(packageName: String): Boolean =
        NexusProtectionPolicy.isEssentialPackage(packageName)
}
