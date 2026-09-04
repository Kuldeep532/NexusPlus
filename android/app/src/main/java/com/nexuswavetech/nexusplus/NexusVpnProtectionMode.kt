package com.nexuswavetech.nexusplus

/**
 * Defines how the protection tunnel behaves when inspection cannot safely make
 * a decision. The protection layer must never become the device's generic
 * internet transport unless a complete forwarding engine is installed.
 */
enum class NexusVpnProtectionMode {
    /** Protection-only mode. Traffic not safely inspected is left to the normal network path. */
    PROTECTION_ONLY,
}

object NexusVpnProtectionConfig {
    val mode: NexusVpnProtectionMode = NexusVpnProtectionMode.PROTECTION_ONLY

    /** True when a packet may be safely discarded by the protection layer. */
    fun mayInterfere(decision: NexusVpnTrafficDecision.Action): Boolean = when (decision) {
        NexusVpnTrafficDecision.Action.HANDLE_DNS -> true
        else -> false
    }
}
