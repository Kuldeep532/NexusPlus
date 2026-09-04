package com.nexuswavetech.nexusplus

/** Best-effort native domain policy bridge. Native data can be hardened further without changing callers. */
object NexusNativeAdultDomainPolicy {
    fun isBlocked(hostname: String): Boolean {
        val normalized = hostname.trim().trim('.').lowercase()
        if (normalized.isBlank()) return false
        return runCatching {
            NexusNativeDomainClassifier.classify(normalized) == 1
        }.getOrDefault(false)
    }
}

private object NexusNativeDomainClassifier {
    private external fun nativeClassifyDomain(domain: String): Int
    fun classify(domain: String): Int = nativeClassifyDomain(domain)
    init { System.loadLibrary("nexus_security") }
}
