package com.nexuswavetech.nexusplus

/** Small deterministic classifier used for domain/content policy decisions. */
object NexusContentPatternEngine {
    fun normalize(value: String): String =
        value.trim().lowercase().trim('.').replace(Regex("\\s+"), " ")

    fun isProtectedDomain(hostname: String): Boolean {
        val normalized = normalize(hostname)
        if (normalized.isBlank()) return false
        if (NexusAdultSafetyPolicy.safeContextSignals.any(normalized::contains)) return false
        return NexusAdultSafetyPolicy.highRiskTextSignals.any(normalized::contains) ||
            NexusVpnDnsPolicy.shouldBlock(normalized)
    }
}
