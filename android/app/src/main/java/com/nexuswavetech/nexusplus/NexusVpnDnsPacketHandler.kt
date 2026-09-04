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

/** Local DNS protection path. Blocking is fail-closed for matched adult domains; forwarding failures fail open. */
object NexusVpnDnsPacketHandler {
    private const val MAX_DNS_PAYLOAD = 4096

    fun handle(service: VpnService, interfaceFd: ParcelFileDescriptor, packet: ByteArray, length: Int) {
        val inspected = NexusVpnPacketInspector.inspect(packet, length)
        if (inspected.kind == NexusVpnPacketInspector.Kind.INVALID) {
            NexusVpnPacketStats.recordDropped()
            return
        }
        if (inspected.kind != NexusVpnPacketInspector.Kind.DNS_UDP) {
            NexusVpnPacketStats.recordNonDns()
            return
        }
        val payloadLength = minOf(inspected.payloadLength, MAX_DNS_PAYLOAD)
        if (payloadLength < 12) {
            NexusVpnPacketStats.recordDropped()
            return
        }

        val query = packet.copyOfRange(inspected.payloadOffset, inspected.payloadOffset + payloadLength)
        val hostname = decodeQuestionName(query) ?: run {
            NexusVpnPacketStats.recordDropped()
            return
        }
        val blocked = NexusVpnDnsPolicy.shouldBlock(hostname)
        val dnsResponse = if (blocked) {
            NexusVpnPacketStats.recordDnsBlocked()
            NexusVpnDnsStats.recordBlocked()
            buildNxDomainResponse(query)
        } else {
            val forwarded = querySystemDns(service, query)
            if (forwarded == null) {
                // Protection must never become the reason ordinary internet access fails.
                // Do not synthesize SERVFAIL; simply leave this request to the host resolver path.
                NexusVpnPacketStats.recordDnsFailed()
                NexusVpnDnsStats.recordFailed()
                return
            }
            NexusVpnPacketStats.recordDnsForwarded()
            NexusVpnDnsStats.recordForwarded()
            forwarded
        }

        val sourceAddress = packet.copyOfRange(16, 20)
        val destinationAddress = packet.copyOfRange(12, 16)
        val response = buildIpv4UdpResponse(
            sourceAddress,
            destinationAddress,
            inspected.destinationPort,
            inspected.sourcePort,
            dnsResponse,
        )
        runCatching {
            FileOutputStream(interfaceFd.fileDescriptor).use { output ->
                output.write(response)
                output.flush()
            }
            NexusVpnPacketStats.recordOut()
        }.onFailure {
            NexusVpnPacketStats.recordDropped()
        }
    }

    private fun querySystemDns(service: VpnService, payload: ByteArray): ByteArray? {
        val cm = service.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager ?: return null
        val network = cm.activeNetwork ?: return null
        val caps = cm.getNetworkCapabilities(network) ?: return null
        if (!caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)) return null
        val dnsServers = cm.getLinkProperties(network)?.dnsServers.orEmpty()
        for (server in dnsServers) {
            val result = runCatching {
                DatagramSocket().use { socket ->
                    if (!service.protect(socket)) return@runCatching null
                    socket.soTimeout = 1200
                    socket.send(
                        DatagramPacket(
                            payload,
                            payload.size,
                            InetAddress.getByAddress(server.address),
                            NexusVpnPacketInspector.DNS_PORT,
                        ),
                    )
                    val buffer = ByteArray(MAX_DNS_PAYLOAD)
                    val response = DatagramPacket(buffer, buffer.size)
                    socket.receive(response)
                    response.data.copyOf(response.length)
                }
            }.getOrNull()
            if (result != null) return result
        }
        return null
    }

    private fun decodeQuestionName(payload: ByteArray): String? {
        if (payload.size < 13 || u16(payload, 4) < 1) return null
        var index = 12
        val labels = mutableListOf<String>()
        repeat(128) {
            if (index >= payload.size) return null
            val size = payload[index].toInt() and 0xff
            index++
            if (size == 0) return labels.joinToString(".").takeIf { it.isNotBlank() }
            if ((size and 0xc0) != 0 || size > 63 || index + size > payload.size) return null
            labels += payload.copyOfRange(index, index + size).toString(Charsets.US_ASCII)
            index += size
        }
        return null
    }

    private fun buildNxDomainResponse(query: ByteArray): ByteArray {
        val response = query.copyOf()
        writeU16(response, 2, (u16(response, 2) or 0x8000 or 0x0080 or 0x0003) and 0xffff)
        writeU16(response, 6, 0)
        writeU16(response, 8, 0)
        writeU16(response, 10, 0)
        return response
    }

    private fun buildIpv4UdpResponse(
        src: ByteArray,
        dst: ByteArray,
        srcPort: Int,
        dstPort: Int,
        dns: ByteArray,
    ): ByteArray {
        val total = 28 + dns.size
        val packet = ByteArray(total)
        packet[0] = 0x45
        packet[8] = 64
        packet[9] = NexusVpnPacketInspector.UDP_PROTOCOL.toByte()
        writeU16(packet, 2, total)
        src.copyInto(packet, 12)
        dst.copyInto(packet, 16)
        writeU16(packet, 10, ipv4Checksum(packet))
        writeU16(packet, 20, srcPort)
        writeU16(packet, 22, dstPort)
        writeU16(packet, 24, 8 + dns.size)
        dns.copyInto(packet, 28)
        writeU16(packet, 26, udpChecksum(packet, src, dst))
        return packet
    }

    private fun ipv4Checksum(packet: ByteArray): Int {
        var sum = 0L
        for (offset in 0 until 20 step 2) if (offset != 10) sum += u16(packet, offset)
        return fold(sum)
    }

    private fun udpChecksum(packet: ByteArray, src: ByteArray, dst: ByteArray): Int {
        var sum = 0L
        sum += u16(src, 0) + u16(src, 2) + u16(dst, 0) + u16(dst, 2)
        sum += NexusVpnPacketInspector.UDP_PROTOCOL + u16(packet, 24)
        for (offset in 20 until packet.size step 2) {
            if (offset == 26) continue
            sum += if (offset + 1 < packet.size) u16(packet, offset) else (packet[offset].toInt() and 0xff) shl 8
        }
        val result = fold(sum)
        return if (result == 0) 0xffff else result
    }

    private fun u16(b: ByteArray, o: Int): Int =
        ((b[o].toInt() and 0xff) shl 8) or (b[o + 1].toInt() and 0xff)

    private fun writeU16(b: ByteArray, o: Int, v: Int) {
        b[o] = (v ushr 8).toByte()
        b[o + 1] = v.toByte()
    }

    private fun fold(value: Long): Int {
        var sum = value
        while ((sum ushr 16) != 0L) sum = (sum and 0xffff) + (sum ushr 16)
        return sum.toInt().inv() and 0xffff
    }
}
