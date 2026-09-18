package com.nexuswavetech.nexusplus

import android.Manifest
import android.content.Context
import android.os.Build
import android.os.Handler
import android.os.Looper
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.*
import java.security.SecureRandom
import java.util.concurrent.ConcurrentHashMap

class NexusRemoteModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "NexusRemote"

    private val connections = ConcurrentHashMap<String, String>()
    private val random = SecureRandom()
    private val mainHandler = Handler(Looper.getMainLooper())

    @ReactMethod
    fun isAvailable(promise: Promise) {
        promise.resolve(Build.VERSION.SDK_INT >= Build.VERSION_CODES.M)
    }

    @ReactMethod
    fun generatePairingCode(promise: Promise) {
        val code = 100000 + random.nextInt(900000)
        promise.resolve(code.toString())
    }

    @ReactMethod
    fun send(device: ReadableMap, action: ReadableMap, promise: Promise) {
        try {
            val type = device.getString("type") ?: throw IllegalArgumentException("Missing device type.")
            val transport = device.getString("transport") ?: throw IllegalArgumentException("Missing transport.")
            val address = if (device.hasKey("address") && !device.isNull("address")) device.getString("address") else null
            val actionKind = action.getString("kind") ?: throw IllegalArgumentException("Missing action kind.")

            when (transport) {
                "ir" -> {
                    if (type != "tv") throw IllegalArgumentException("IR transport is supported for TV remotes only.")
                    // IR blast requires a device-specific protocol database and an Android device
                    // with an exposed consumer IR transmitter. This bridge intentionally fails closed
                    // until a real IR transport is available instead of pretending to send commands.
                    throw IllegalStateException("IR hardware transport is not available in this build.")
                }
                "wifi", "bluetooth" -> {
                    if (address.isNullOrBlank()) throw IllegalArgumentException("A paired device address is required.")
                    // Transport framing is intentionally kept behind this native bridge. The target
                    // endpoint must run a Nexus-compatible receiver and verify the paired session.
                    throw IllegalStateException("Nexus device receiver is not available yet for this connection.")
                }
                else -> throw IllegalArgumentException("Unsupported remote transport.")
            }
        } catch (e: Exception) {
            promise.reject("REMOTE_SEND_FAILED", e.message, e)
        }
    }
}
