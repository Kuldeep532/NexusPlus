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

        // Never use broad text-safe-context matching to whitelist a domain name.
        // Educational/medical websites normally have their own neutral domains and
        // should pass unless their actual hostname contains a high-confidence adult label.
        val labels = normalized.split('.').filter(String::isNotBlank)
        return labels.any { label -> blockedLabels.any { blocked ->
            label == blocked || label.startsWith("$blocked-") || label.endsWith("-$blocked")
        } }
    }
}
