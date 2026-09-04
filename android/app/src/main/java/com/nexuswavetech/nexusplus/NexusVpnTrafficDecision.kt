package com.nexuswavetech.nexusplus

/**
 * Pure routing decision for packets read from the Android TUN interface.
 *
 * Non-DNS forwarding is allowed only after a protocol-correct userspace
 * forwarding engine explicitly reports ready. This prevents the tunnel from
 * silently black-holing normal application traffic.
 */
object NexusVpnTrafficDecision {
    enum class Action {
        HANDLE_DNS,
        FORWARD_TCP,
        FORWARD_UDP,
        IGNORE_OTHER_IPV4,
        DROP_INVALID,
    }

    fun decide(
        kind: NexusVpnPacketInspector.Kind,
        forwardingReady: Boolean = NexusVpnForwardingState.isReady(),
    ): Action = when (kind) {
        NexusVpnPacketInspector.Kind.DNS_UDP -> Action.HANDLE_DNS
        NexusVpnPacketInspector.Kind.TCP ->
            if (forwardingReady) Action.FORWARD_TCP else Action.IGNORE_OTHER_IPV4
        NexusVpnPacketInspector.Kind.NON_DNS_UDP ->
            if (forwardingReady) Action.FORWARD_UDP else Action.IGNORE_OTHER_IPV4
        NexusVpnPacketInspector.Kind.OTHER_IPV4 -> Action.IGNORE_OTHER_IPV4
        NexusVpnPacketInspector.Kind.INVALID -> Action.DROP_INVALID
    }
}
