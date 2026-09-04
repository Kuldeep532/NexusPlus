package com.nexuswavetech.nexusplus

import org.junit.Assert.assertEquals
import org.junit.Test

class NexusVpnTrafficDecisionTest {
    @Test
    fun dnsIsHandledLocally() {
        assertEquals(
            NexusVpnTrafficDecision.Action.HANDLE_DNS,
            NexusVpnTrafficDecision.decide(NexusVpnPacketInspector.Kind.DNS_UDP, forwardingReady = false),
        )
    }

    @Test
    fun tcpStaysOutOfTunnelUntilForwardingEngineIsReady() {
        assertEquals(
            NexusVpnTrafficDecision.Action.IGNORE_OTHER_IPV4,
            NexusVpnTrafficDecision.decide(NexusVpnPacketInspector.Kind.TCP, forwardingReady = false),
        )
    }

    @Test
    fun tcpCanBeForwardedAfterExplicitReadiness() {
        assertEquals(
            NexusVpnTrafficDecision.Action.FORWARD_TCP,
            NexusVpnTrafficDecision.decide(NexusVpnPacketInspector.Kind.TCP, forwardingReady = true),
        )
    }

    @Test
    fun nonDnsUdpStaysOutOfTunnelUntilForwardingEngineIsReady() {
        assertEquals(
            NexusVpnTrafficDecision.Action.IGNORE_OTHER_IPV4,
            NexusVpnTrafficDecision.decide(NexusVpnPacketInspector.Kind.NON_DNS_UDP, forwardingReady = false),
        )
    }

    @Test
    fun nonDnsUdpCanBeForwardedAfterExplicitReadiness() {
        assertEquals(
            NexusVpnTrafficDecision.Action.FORWARD_UDP,
            NexusVpnTrafficDecision.decide(NexusVpnPacketInspector.Kind.NON_DNS_UDP, forwardingReady = true),
        )
    }

    @Test
    fun malformedPacketsAreDropped() {
        assertEquals(
            NexusVpnTrafficDecision.Action.DROP_INVALID,
            NexusVpnTrafficDecision.decide(NexusVpnPacketInspector.Kind.INVALID, forwardingReady = false),
        )
    }
}
