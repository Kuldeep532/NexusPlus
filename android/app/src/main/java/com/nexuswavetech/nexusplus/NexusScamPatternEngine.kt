package com.nexuswavetech.nexusplus

import java.util.Locale

/** Conservative, local-only scam detector. It blocks only high-confidence combinations. */
object NexusScamPatternEngine {
    private val urgency = setOf("urgent", "immediately", "act now", "within 24 hours", "last warning", "final notice")
    private val credentialRequests = setOf("otp", "one time password", "cvv", "pin", "password", "mpin", "upi pin", "card number")
    private val paymentRequests = setOf("send money", "pay now", "transfer money", "collect request", "upi collect", "gift card", "crypto")
    private val impersonation = setOf("account will be blocked", "kyc expired", "kyc suspended", "bank account blocked", "police case", "income tax notice", "customs fee", "parcel held", "electricity disconnected")
    private val scamDomains = setOf("bit.ly", "tinyurl.com", "t.co", "rb.gy", "cutt.ly", "is.gd")
    private val trustedBankHosts = setOf(
        "sbi.co.in", "hdfcbank.com", "icicibank.com", "axisbank.com", "kotak.com",
        "bankofbaroda.in", "pnbindia.in", "canarabank.com", "unionbankofindia.co.in",
        "idfcfirstbank.com", "indusind.com", "yesbank.in", "rblbank.com"
    )

    fun classify(text: String): Decision {
        val normalized = text.lowercase(Locale.ROOT).replace(Regex("\\s+"), " ").trim()
        if (normalized.isBlank()) return Decision.ALLOW
        if (containsTrustedBankDomain(normalized)) return Decision.ALLOW

        val hasUrgency = urgency.any(normalized::contains)
        val asksCredential = credentialRequests.any(normalized::contains)
        val asksPayment = paymentRequests.any(normalized::contains)
        val impersonates = impersonation.any(normalized::contains)
        val shortenedLink = scamDomains.any(normalized::contains)
        val suspiciousLink = containsSuspiciousLink(normalized)

        val score = listOf(
            hasUrgency, asksCredential, asksPayment, impersonates,
            shortenedLink || suspiciousLink
        ).count { it }

        return when {
            score >= 3 -> Decision.BLOCK
            asksCredential && (hasUrgency || impersonates || suspiciousLink) -> Decision.BLOCK
            asksPayment && (hasUrgency || impersonates || suspiciousLink) -> Decision.BLOCK
            else -> Decision.ALLOW
        }
    }

    private fun containsTrustedBankDomain(text: String): Boolean =
        trustedBankHosts.any { host -> text.contains(host) }

    private fun containsSuspiciousLink(text: String): Boolean {
        val urlRegex = Regex("https?://[^\\s]+", RegexOption.IGNORE_CASE)
        return urlRegex.findAll(text).any { match ->
            val url = match.value.lowercase(Locale.ROOT)
            url.contains("@") || url.count { it == '.' } >= 5 ||
                listOf("verify", "secure", "login", "kyc", "refund", "reward").count(url::contains) >= 2
        }
    }

    enum class Decision { ALLOW, BLOCK }
}
