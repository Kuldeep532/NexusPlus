package com.nexuswavetech.nexusplus

/** Conservative local DNS-domain policy used by the Nexus VPN. */
object NexusVpnDnsPolicy {
    private val blockedLabels = setOf(
        "porn", "pornography", "xxx", "nsfw", "hentai", "sexcam", "camsex",
        "pornhub", "xvideos", "xnxx", "xhamster", "redtube", "spankbang", "youjizz", "rule34",
    )

    fun shouldBlock(hostname: String): Boolean {
        val normalized = hostname.trim().trim('.').lowercase()
        if (normalized.isBlank()) return false
        if (NexusAdultSafetyPolicy.safeContextSignals.any(normalized::contains)) return false
        if (NexusAdultSafetyPolicy.highRiskTextSignals.any(normalized::contains)) return true
        val labels = normalized.split('.').filter(String::isNotBlank)
        return labels.any { label -> blockedLabels.any { blocked ->
            label == blocked || label.startsWith("$blocked-") || label.endsWith("-$blocked")
        } }
    }
}
