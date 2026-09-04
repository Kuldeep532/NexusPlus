package com.nexuswavetech.nexusplus

/** Pure packet inspection for the user-consented Nexus protection tunnel. */
object NexusVpnPacketInspector {
    const val IPV4_PROTOCOL = 4
    const val UDP_PROTOCOL = 17
    const val TCP_PROTOCOL = 6
    const val DNS_PORT = 53

    enum class Kind {
        INVALID,
        DNS_UDP,
        NON_DNS_UDP,
        TCP,
        OTHER_IPV4,
    }

    data class Result(
        val kind: Kind,
        val headerLength: Int = 0,
        val sourcePort: Int = 0,
        val destinationPort: Int = 0,
        val payloadOffset: Int = 0,
        val payloadLength: Int = 0,
    )

    fun inspect(packet: ByteArray, length: Int = packet.size): Result {
        if (length < 20 || length > packet.size) return Result(Kind.INVALID)
        val first = packet[0].toInt() and 0xff
        val version = first ushr 4
        val ihlWords = first and 0x0f
        val headerLength = ihlWords * 4
        if (version != IPV4_PROTOCOL || headerLength < 20 || length < headerLength) {
            return Result(Kind.INVALID)
        }

        return when (packet[9].toInt() and 0xff) {
            UDP_PROTOCOL -> inspectUdp(packet, length, headerLength)
            TCP_PROTOCOL -> Result(Kind.TCP, headerLength)
            else -> Result(Kind.OTHER_IPV4, headerLength)
        }
    }

    private fun inspectUdp(packet: ByteArray, length: Int, headerLength: Int): Result {
        if (length < headerLength + 8) return Result(Kind.INVALID)
        val sourcePort = u16(packet, headerLength)
        val destinationPort = u16(packet, headerLength + 2)
        val udpLength = u16(packet, headerLength + 4)
        if (udpLength < 8 || headerLength + udpLength > length) return Result(Kind.INVALID)
        val payloadOffset = headerLength + 8
        val payloadLength = udpLength - 8
        return Result(
            kind = if (destinationPort == DNS_PORT) Kind.DNS_UDP else Kind.NON_DNS_UDP,
            headerLength = headerLength,
            sourcePort = sourcePort,
            destinationPort = destinationPort,
            payloadOffset = payloadOffset,
            payloadLength = payloadLength,
        )
    }

    private fun u16(bytes: ByteArray, offset: Int): Int =
        ((bytes[offset].toInt() and 0xff) shl 8) or (bytes[offset + 1].toInt() and 0xff)
}
