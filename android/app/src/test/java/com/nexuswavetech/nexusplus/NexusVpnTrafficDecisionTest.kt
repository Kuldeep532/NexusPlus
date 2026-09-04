package com.nexuswavetech.nexusplus

import org.junit.Assert.assertEquals
import org.junit.Test

class NexusVpnTrafficDecisionTest {
    @Test
    fun dnsIsHandledLocally() {
        assertEquals(
            NexusVpnTrafficDecision.Action.HANDLE_DNS,
            NexusVpnTrafficDecision.decide(NexusVpnPacketInspector.Kind.DNS_UDP),
        )
    }

    @Test
    fun tcpIsReservedForForwardingEngine() {
        assertEquals(
            NexusVpnTrafficDecision.Action.FORWARD_TCP,
            NexusVpnTrafficDecision.decide(NexusVpnPacketInspector.Kind.TCP),
        )
    }

    @Test
    fun nonDnsUdpIsReservedForForwardingEngine() {
        assertEquals(
            NexusVpnTrafficDecision.Action.FORWARD_UDP,
            NexusVpnTrafficDecision.decide(NexusVpnPacketInspector.Kind.NON_DNS_UDP),
        )
    }

    @Test
    fun malformedPacketsAreDropped() {
        assertEquals(
            NexusVpnTrafficDecision.Action.DROP_INVALID,
            NexusVpnTrafficDecision.decide(NexusVpnPacketInspector.Kind.INVALID),
        )
    }
}
