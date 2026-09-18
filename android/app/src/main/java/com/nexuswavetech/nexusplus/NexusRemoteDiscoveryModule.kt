package com.nexuswavetech.nexusplus

import android.content.Context
import android.net.wifi.WifiManager
import android.os.Build
import com.facebook.react.bridge.*
import java.net.Inet4Address
import java.net.NetworkInterface
import java.util.Collections

class NexusRemoteDiscoveryModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "NexusRemoteDiscovery"

    @ReactMethod
    fun getLocalNetworkInfo(promise: Promise) {
        try {
            val wifi = reactContext.applicationContext.getSystemService(Context.WIFI_SERVICE) as? WifiManager
            val connection = wifi?.connectionInfo
            promise.resolve(Arguments.createMap().apply {
                putBoolean("wifiEnabled", wifi?.isWifiEnabled == true)
                putString("ssid", connection?.ssid?.trim('"'))
                putString("ipAddress", ipv4Address())
            })
        } catch (error: Exception) {
            promise.reject("DISCOVERY_INFO_FAILED", error.message, error)
        }
    }

    private fun ipv4Address(): String? {
        return Collections.list(NetworkInterface.getNetworkInterfaces())
            .asSequence()
            .flatMap { Collections.list(it.inetAddresses).asSequence() }
            .filterIsInstance<Inet4Address>()
            .map { it.hostAddress }
            .firstOrNull { it != "127.0.0.1" }
    }
}
