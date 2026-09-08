package com.nexuswavetech.nexusplus

import android.content.Context
import android.net.wifi.WifiManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.net.SocketTimeoutException
import java.nio.charset.StandardCharsets
import java.util.UUID

class NexusCctvDiscoveryModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    companion object {
        private const val MODULE = "NexusCctvDiscovery"
        private const val WS_DISCOVERY_PORT = 3702
        private const val MULTICAST_ADDRESS = "239.255.255.250"
        private const val MAX_RESPONSE_BYTES = 256 * 1024
        private const val DEFAULT_TIMEOUT_MS = 5000
    }

    override fun getName(): String = MODULE

    @ReactMethod
    fun discover(timeoutMs: Int, promise: Promise) {
        val boundedTimeout = timeoutMs.coerceIn(1000, 15000)
        Thread {
            var socket: DatagramSocket? = null
            var multicastLock: WifiManager.MulticastLock? = null
            try {
                val wifi = reactContext.applicationContext.getSystemService(Context.WIFI_SERVICE) as? WifiManager
                multicastLock = wifi?.createMulticastLock("NexusCctvDiscovery")?.apply {
                    setReferenceCounted(true)
                    acquire()
                }
                socket = DatagramSocket()
                socket.soTimeout = boundedTimeout
                socket.broadcast = true
                val probe = buildProbe()
                val bytes = probe.toByteArray(StandardCharsets.UTF_8)
                val address = InetAddress.getByName(MULTICAST_ADDRESS)
                socket.send(DatagramPacket(bytes, bytes.size, address, WS_DISCOVERY_PORT))

                val seen = linkedMapOf<String, WritableMap>()
                val deadline = System.currentTimeMillis() + boundedTimeout
                val buffer = ByteArray(MAX_RESPONSE_BYTES)
                while (System.currentTimeMillis() < deadline) {
                    val packet = DatagramPacket(buffer, buffer.size)
                    try {
                        socket.receive(packet)
                    } catch (_: SocketTimeoutException) {
                        break
                    }
                    val xml = String(packet.data, packet.offset, packet.length, StandardCharsets.UTF_8)
                    parseDevice(xml, packet.address.hostAddress ?: "")?.let { device ->
                        val key = device.getString("xaddrs") ?: device.getString("endpoint") ?: UUID.randomUUID().toString()
                        if (!seen.containsKey(key)) seen[key] = device
                    }
                }
                val result = Arguments.createArray()
                seen.values.forEach { result.pushMap(it) }
                promise.resolve(result)
            } catch (error: Throwable) {
                promise.reject("CCTV_DISCOVERY", "ONVIF discovery failed.", error)
            } finally {
                try { socket?.close() } catch (_: Throwable) { }
                try { multicastLock?.release() } catch (_: Throwable) { }
            }
        }.start()
    }

    private fun buildProbe(): String {
        val messageId = "uuid:${UUID.randomUUID()}"
        return """
            <s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://www.w3.org/2005/08/addressing" xmlns:d="http://schemas.xmlsoap.org/ws/2005/04/discovery">
              <s:Header>
                <a:Action s:mustUnderstand="1">http://schemas.xmlsoap.org/ws/2005/04/discovery/Probe</a:Action>
                <a:MessageID>$messageId</a:MessageID>
                <a:ReplyTo><a:Address>http://www.w3.org/2005/08/addressing/anonymous</a:Address></a:ReplyTo>
                <a:To s:mustUnderstand="1">urn:schemas-xmlsoap-org:ws:2005:04:discovery</a:To>
              </s:Header>
              <s:Body>
                <d:Probe>
                  <d:Type>dn:NetworkVideoTransmitter</d:Type>
                </d:Probe>
              </s:Body>
            </s:Envelope>
        """.trimIndent()
    }

    private fun parseDevice(xml: String, sourceIp: String): WritableMap? {
        if (!xml.contains("NetworkVideoTransmitter", ignoreCase = true) &&
            !xml.contains("NetworkVideoDisplay", ignoreCase = true)) return null
        val map = Arguments.createMap()
        map.putString("sourceIp", sourceIp)
        map.putString("endpoint", firstTag(xml, "Address"))
        map.putString("xaddrs", firstTag(xml, "XAddrs"))
        map.putString("types", firstTag(xml, "Types"))
        map.putString("scopes", firstTag(xml, "Scopes"))
        return map
    }

    private fun firstTag(xml: String, localName: String): String? {
        val pattern = Regex("<(?:[A-Za-z0-9_.-]+:)?$localName(?:\\s[^>]*)?>(.*?)</(?:[A-Za-z0-9_.-]+:)?$localName>", setOf(RegexOption.IGNORE_CASE, RegexOption.DOT_MATCHES_ALL))
        return pattern.find(xml)?.groupValues?.getOrNull(1)?.trim()?.take(8192)
    }
}
