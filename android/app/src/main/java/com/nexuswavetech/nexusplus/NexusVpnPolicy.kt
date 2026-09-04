package com.nexuswavetech.nexusplus

/** Local policy state for Nexus Content Protection VPN. */
object NexusVpnPolicy {
    private const val PREFS = "nexus_content_protection_vpn"
    private const val KEY_ENABLED = "enabled"
    private const val KEY_CONSENT = "user_consent"
    private const val KEY_BLOCK_PRIVATE_DNS = "block_private_dns"
    private const val KEY_BLOCK_KNOWN_UNSAFE_DOMAINS = "block_known_unsafe_domains"

    fun hasConsent(context: android.content.Context): Boolean =
        context.getSharedPreferences(PREFS, android.content.Context.MODE_PRIVATE).getBoolean(KEY_CONSENT, false)

    fun isEnabled(context: android.content.Context): Boolean =
        hasConsent(context) && context.getSharedPreferences(PREFS, android.content.Context.MODE_PRIVATE).getBoolean(KEY_ENABLED, false)

    fun setConsent(context: android.content.Context, allowed: Boolean) {
        context.getSharedPreferences(PREFS, android.content.Context.MODE_PRIVATE).edit()
            .putBoolean(KEY_CONSENT, allowed)
            .putBoolean(KEY_ENABLED, allowed)
            .apply()
    }

    fun setEnabled(context: android.content.Context, enabled: Boolean) {
        context.getSharedPreferences(PREFS, android.content.Context.MODE_PRIVATE).edit().putBoolean(KEY_ENABLED, enabled).apply()
    }

    fun blockPrivateDns(context: android.content.Context): Boolean =
        context.getSharedPreferences(PREFS, android.content.Context.MODE_PRIVATE).getBoolean(KEY_BLOCK_PRIVATE_DNS, true)

    fun blockKnownUnsafeDomains(context: android.content.Context): Boolean =
        context.getSharedPreferences(PREFS, android.content.Context.MODE_PRIVATE).getBoolean(KEY_BLOCK_KNOWN_UNSAFE_DOMAINS, true)
}
