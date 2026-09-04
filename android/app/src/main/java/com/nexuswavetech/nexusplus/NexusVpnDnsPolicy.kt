package com.nexuswavetech.nexusplus

import java.util.Locale

/** Conservative adult-domain policy: block only high-confidence adult domains. */
object NexusVpnDnsPolicy {
    private val blockedLabels = setOf(
        "porn", "pornography", "xxx", "nsfw", "hentai", "sexcam", "camsex",
        "pornhub", "xvideos", "xnxx", "xhamster", "redtube", "spankbang", "youjizz", "rule34",
    )

    fun shouldBlock(hostname: String): Boolean {
        val normalized = hostname.trim().trim('.').lowercase(Locale.ROOT)
        if (normalized.isBlank()) return false

        // The native policy is an additional local check. Safe educational/medical
        // domains are not blanket-whitelisted; only their actual hostnames are passed.
        if (NexusNativeAdultDomainPolicy.isBlocked(normalized)) return true

        val labels = normalized.split('.').filter(String::isNotBlank)
        return labels.any { label -> blockedLabels.any { blocked ->
            label == blocked || label.startsWith("$blocked-") || label.endsWith("-$blocked")
        } }
    }
}
