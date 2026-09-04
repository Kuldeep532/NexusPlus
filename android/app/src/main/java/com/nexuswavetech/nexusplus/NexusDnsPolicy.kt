package com.nexuswavetech.nexusplus

/** Pure on-device DNS/content policy helpers. No server or remote list required. */
object NexusDnsPolicy {
    private val blockedDomains = setOf(
        "pornhub.com",
        "xvideos.com",
        "xnxx.com",
        "xhamster.com",
        "redtube.com",
        "youporn.com",
        "spankbang.com",
        "xhamsterlive.com",
    )

    private val safeSearchHosts = setOf(
        "www.google.com",
        "www.google.co.in",
        "www.bing.com",
        "search.yahoo.com",
    )

    fun shouldSinkhole(host: String): Boolean {
        val normalized = host.trim().lowercase().trimEnd('.')
        return normalized.isNotBlank() && blockedDomains.any {
            normalized == it || normalized.endsWith(".$it")
        }
    }

    fun requiresSafeSearch(host: String): Boolean =
        host.trim().lowercase().trimEnd('.') in safeSearchHosts
}
