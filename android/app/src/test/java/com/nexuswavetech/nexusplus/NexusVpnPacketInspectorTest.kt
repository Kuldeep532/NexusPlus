package com.nexuswavetech.nexusplus

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class NexusVpnPacketInspectorTest {
    @Test
    fun rejectsTruncatedIpv4Packet() {
        val result = NexusVpnPacketInspector.inspect(ByteArray(19))
        assertEquals(NexusVpnPacketInspector.Kind.INVALID, result.kind)
    }

    @Test
    fun identifiesDnsUdpPacket() {
        val packet = ipv4UdpPacket(sourcePort = 49152, destinationPort = 53, payload = byteArrayOf(0, 1, 2, 3))
        val result = NexusVpnPacketInspector.inspect(packet)
        assertEquals(NexusVpnPacketInspector.Kind.DNS_UDP, result.kind)
        assertEquals(49152, result.sourcePort)
        assertEquals(53, result.destinationPort)
        assertEquals(28, result.payloadOffset)
        assertEquals(4, result.payloadLength)
    }

    @Test
    fun identifiesNonDnsUdpPacket() {
        val packet = ipv4UdpPacket(sourcePort = 49152, destinationPort = 443, payload = byteArrayOf(1, 2, 3))
        val result = NexusVpnPacketInspector.inspect(packet)
        assertEquals(NexusVpnPacketInspector.Kind.NON_DNS_UDP, result.kind)
    }

    @Test
    fun identifiesTcpPacket() {
        val packet = ByteArray(40)
        packet[0] = 0x45
        packet[9] = NexusVpnPacketInspector.TCP_PROTOCOL.toByte()
        val result = NexusVpnPacketInspector.inspect(packet)
        assertEquals(NexusVpnPacketInspector.Kind.TCP, result.kind)
        assertEquals(20, result.headerLength)
    }

    private fun ipv4UdpPacket(sourcePort: Int, destinationPort: Int, payload: ByteArray): ByteArray {
        val packet = ByteArray(28 + payload.size)
        packet[0] = 0x45
        packet[9] = NexusVpnPacketInspector.UDP_PROTOCOL.toByte()
        packet[12] = 10
        packet[16] = 8
        packet[20] = (sourcePort ushr 8).toByte()
        packet[21] = sourcePort.toByte()
        packet[22] = (destinationPort ushr 8).toByte()
        packet[23] = destinationPort.toByte()
        val udpLength = 8 + payload.size
        packet[24] = (udpLength ushr 8).toByte()
        packet[25] = udpLength.toByte()
        payload.copyInto(packet, 28)
        assertTrue(packet.size >= 28)
        return packet
    }
}
