package com.nexuswavetech.nexusplus

/**
 * Conservative local classifier for accessibility-extracted UI text.
 * It never treats an entire app as harmful; only recognizable surfaces are candidates.
 */
object NexusContentPatternEngine {
    enum class ContentClass { UNKNOWN, KNOWLEDGEABLE, ADDICTIVE, SENSITIVE }

    private val addictiveTerms = setOf(
        "reels", "reel", "shorts", "short video", "endless scroll", "infinite scroll",
        "for you", "fyp", "suggested videos", "recommended for you", "watch next",
        "doomscroll", "trending feed", "swipe for more",
    )
    private val knowledgeTerms = setOf(
        "lecture", "lesson", "tutorial", "course", "documentary", "how to", "explained",
        "study", "education", "educational", "science", "history", "mathematics", "news analysis",
        "research", "class", "chapter", "gita", "geeta", "spiritual discourse",
    )
    private val sensitiveTerms = setOf(
        "porn", "pornography", "explicit", "xxx", "adult", "nsfw", "sexual content",
    )

    fun classify(text: String): ContentClass {
        val normalized = text.lowercase().replace(Regex("\\s+"), " ").trim()
        if (normalized.isBlank()) return ContentClass.UNKNOWN
        if (sensitiveTerms.any(normalized::contains)) return ContentClass.SENSITIVE
        val addictive = addictiveTerms.count(normalized::contains)
        val knowledge = knowledgeTerms.count(normalized::contains)
        return when {
            knowledge > addictive -> ContentClass.KNOWLEDGEABLE
            addictive > 0 -> ContentClass.ADDICTIVE
            else -> ContentClass.UNKNOWN
        }
    }
}
