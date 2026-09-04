package com.nexuswavetech.nexusplus

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.VpnService
import android.os.ParcelFileDescriptor
import java.io.FileOutputStream
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.nio.ByteBuffer

/** Minimal IPv4/UDP DNS proxy for the local Nexus VPN DNS address. */
object NexusVpnDnsPacketHandler {
    private const val DNS_PORT = 53
    private const val UDP_PROTOCOL = 17
    private const val IPV4_PROTOCOL_OFFSET = 9
    private const val IPV4_SOURCE_OFFSET = 12
    private const val IPV4_DEST_OFFSET = 16
    private const val UDP_SOURCE_PORT_OFFSET = 0
    private const val UDP_DEST_PORT_OFFSET = 2
    private const val UDP_LENGTH = 8
    private const val MAX_DNS_PAYLOAD = 4096

    fun handle(
        service: VpnService,
        interfaceFd: ParcelFileDescriptor,
        packet: ByteArray,
        length: Int,
    ) {
        if (length < 20) return
        val version = (packet[0].toInt() ushr 4) and 0x0f
        val ihl = (packet[0].toInt() and 0x0f) * 4
        if (version != 4 || ihl < 20 || length < ihl + UDP_LENGTH) return
        if ((packet[IPV4_PROTOCOL_OFFSET].toInt() and 0xff) != UDP_PROTOCOL) return

        val udpOffset = ihl
        val sourcePort = readU16(packet, udpOffset + UDP_SOURCE_PORT_OFFSET)
        val destPort = readU16(packet, udpOffset + UDP_DEST_PORT_OFFSET)
        if (destPort != DNS_PORT) return

        val udpPayloadOffset = udpOffset + UDP_LENGTH
        val udpLength = readU16(packet, udpOffset + 4)
        if (udpLength < UDP_LENGTH || udpPayloadOffset >= length) return
        val payloadLength = minOf(udpLength - UDP_LENGTH, length - udpPayloadOffset, MAX_DNS_PAYLOAD)
        if (payloadLength < 12) return

        val dnsPayload = packet.copyOfRange(udpPayloadOffset, udpPayloadOffset + payloadLength)
        val hostname = decodeQuestionName(dnsPayload) ?: return
        val responseDns = if (NexusVpnDnsPolicy.shouldBlock(hostname)) {
            buildNxDomainResponse(dnsPayload)
        } else {
            querySystemDns(service, dnsPayload) ?: buildServFailResponse(dnsPayload)
        }

        val sourceAddress = packet.copyOfRange(IPV4_DEST_OFFSET, IPV4_DEST_OFFSET + 4)
        val destinationAddress = packet.copyOfRange(IPV4_SOURCE_OFFSET, IPV4_SOURCE_OFFSET + 4)
        val response = buildIpv4UdpResponse(
            sourceAddress = sourceAddress,
            destinationAddress = destinationAddress,
            sourcePort = destPort,
            destinationPort = sourcePort,
            dnsPayload = responseDns,
        )

        FileOutputStream(interfaceFd.fileDescriptor).use { output ->
            output.write(response)
            output.flush()
        }
    }

    private fun querySystemDns(service: VpnService, dnsPayload: ByteArray): ByteArray? {
        val connectivity = service.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            ?: return null
        val activeNetwork = connectivity.activeNetwork ?: return null
        val capabilities = connectivity.getNetworkCapabilities(activeNetwork) ?: return null
        if (!capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)) return null
        val dnsServers = connectivity.getLinkProperties(activeNetwork)?.dnsServers.orEmpty()
        if (dnsServers.isEmpty()) return null

        for (server in dnsServers) {
            runCatching {
                DatagramSocket().use { socket ->
                    if (!service.protect(socket)) return@runCatching null
                    socket.soTimeout = 1800
                    val destination = InetAddress.getByAddress(server.address)
                    val query = DatagramPacket(dnsPayload, dnsPayload.size, destination, DNS_PORT)
                    socket.send(query)
                    val responseBuffer = ByteArray(MAX_DNS_PAYLOAD)
                    val response = DatagramPacket(responseBuffer, responseBuffer.size)
                    socket.receive(response)
                    return response.data.copyOf(response.length)
                }
            }
        }
        return null
    }

    private fun decodeQuestionName(dnsPayload: ByteArray): String? {
        if (dnsPayload.size < 13) return null
        val questions = readU16(dnsPayload, 4)
        if (questions < 1) return null

        var index = 12
        val labels = mutableListOf<String>()
        repeat(128) {
            if (index >= dnsPayload.size) return null
            val labelLength = dnsPayload[index].toInt() and 0xff
            index += 1
            if (labelLength == 0) {
                if (index + 4 > dnsPayload.size) return null
                return labels.joinToString(".")
            }
            if ((labelLength and 0xc0) != 0 || labelLength > 63 || index + labelLength > dnsPayload.size) return null
            val label = dnsPayload.copyOfRange(index, index + labelLength).toString(Charsets.US_ASCII)
            if (label.isBlank()) return null
            labels += label
            index += labelLength
        }
        return null
    }

    private fun buildNxDomainResponse(query: ByteArray): ByteArray {
        val response = query.copyOf()
        val flags = readU16(response, 2)
        writeU16(response, 2, (flags or 0x8000 or 0x0080 or 0x0003) and 0xffff)
        writeU16(response, 6, 0)
        writeU16(response, 8, 0)
        writeU16(response, 10, 0)
        return response
    }

    private fun buildServFailResponse(query: ByteArray): ByteArray {
        val response = query.copyOf()
        val flags = readU16(response, 2)
        writeU16(response, 2, (flags or 0x8000 or 0x0080 or 0x0002) and 0xffff)
        writeU16(response, 6, 0)
        writeU16(response, 8, 0)
        writeU16(response, 10, 0)
        return response
    }

    private fun buildIpv4UdpResponse(
        sourceAddress: ByteArray,
        destinationAddress: ByteArray,
        sourcePort: Int,
        destinationPort: Int,
        dnsPayload: ByteArray,
    ): ByteArray {
        val totalLength = 20 + 8 + dnsPayload.size
        val packet = ByteArray(totalLength)
        packet[0] = 0x45
        packet[1] = 0
        writeU16(packet, 2, totalLength)
        writeU16(packet, 4, 0)
        writeU16(packet, 6, 0)
        packet[8] = 64
        packet[9] = UDP_PROTOCOL.toByte()
        sourceAddress.copyInto(packet, IPV4_SOURCE_OFFSET)
        destinationAddress.copyInto(packet, IPV4_DEST_OFFSET)
        writeU16(packet, 10, ipv4HeaderChecksum(packet))

        val udpOffset = 20
        writeU16(packet, udpOffset, sourcePort)
        writeU16(packet, udpOffset + 2, destinationPort)
        writeU16(packet, udpOffset + 4, 8 + dnsPayload.size)
        writeU16(packet, udpOffset + 6, 0)
        dnsPayload.copyInto(packet, udpOffset + 8)
        writeU16(packet, udpOffset + 6, udpChecksum(packet, udpOffset, sourceAddress, destinationAddress))
        return packet
    }

    private fun ipv4HeaderChecksum(packet: ByteArray): Int {
        var sum = 0L
        var offset = 0
        repeat(10) {
            if (offset == 10) {
                offset += 2
            } else {
                sum += readU16(packet, offset).toLong()
                offset += 2
            }
        }
        return finalizeChecksum(sum)
    }

    private fun udpChecksum(
        packet: ByteArray,
        udpOffset: Int,
        sourceAddress: ByteArray,
        destinationAddress: ByteArray,
    ): Int {
        var sum = 0L
        sum += readU16(sourceAddress, 0)
        sum += readU16(sourceAddress, 2)
        sum += readU16(destinationAddress, 0)
        sum += readU16(destinationAddress, 2)
        sum += UDP_PROTOCOL
        sum += readU16(packet, udpOffset + 4)

        var offset = udpOffset
        val length = readU16(packet, udpOffset + 4)
        var remaining = length
        while (remaining >= 2) {
            if (offset != udpOffset + 6) sum += readU16(packet, offset).toLong()
            offset += 2
            remaining -= 2
        }
        if (remaining == 1) sum += (packet[offset].toInt() and 0xff) shl 8
        val checksum = finalizeChecksum(sum)
        return if (checksum == 0) 0xffff else checksum
    }

    private fun readU16(bytes: ByteArray, offset: Int): Int =
        ((bytes[offset].toInt() and 0xff) shl 8) or (bytes[offset + 1].toInt() and 0xff)

    private fun writeU16(bytes: ByteArray, offset: Int, value: Int) {
        bytes[offset] = (value ushr 8).toByte()
        bytes[offset + 1] = value.toByte()
    }

    private fun finalizeChecksum(sumValue: Long): Int {
        var sum = sumValue
        while ((sum ushr 16) != 0L) sum = (sum and 0xffff) + (sum ushr 16)
        return sum.toInt().inv() and 0xffff
    }
}
