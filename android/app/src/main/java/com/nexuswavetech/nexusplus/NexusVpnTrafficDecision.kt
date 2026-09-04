package com.nexuswavetech.nexusplus

/**
 * Pure routing decision for packets read from the Android TUN interface.
 *
 * Forwarding is deliberately disabled until a protocol-correct userspace
 * transport engine is available. This object makes that safety boundary
 * explicit and testable instead of silently dropping traffic inside handlers.
 */
object NexusVpnTrafficDecision {
    enum class Action {
        HANDLE_DNS,
        FORWARD_TCP,
        FORWARD_UDP,
        IGNORE_OTHER_IPV4,
        DROP_INVALID,
    }

    fun decide(kind: NexusVpnPacketInspector.Kind): Action = when (kind) {
        NexusVpnPacketInspector.Kind.DNS_UDP -> Action.HANDLE_DNS
        NexusVpnPacketInspector.Kind.TCP -> Action.FORWARD_TCP
        NexusVpnPacketInspector.Kind.NON_DNS_UDP -> Action.FORWARD_UDP
        NexusVpnPacketInspector.Kind.OTHER_IPV4 -> Action.IGNORE_OTHER_IPV4
        NexusVpnPacketInspector.Kind.INVALID -> Action.DROP_INVALID
    }
}
