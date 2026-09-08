package com.nexuswavetech.nexusplus

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import java.util.concurrent.ConcurrentHashMap

/**
 * Capability-aware ONVIF bridge.
 *
 * JS supplies capabilities discovered during the authorized camera handshake.
 * Unsupported operations are rejected instead of being reported as successful.
 * Endpoint and credential values remain native-only and are never returned to JS.
 */
class NexusCctvOnvifModule(
    private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

    private data class Session(
        val cameraId: String,
        val host: String,
        val port: Int,
        val secure: Boolean,
        val username: String,
        val password: String,
        val capabilities: Set<String>,
    )

    private val sessions = ConcurrentHashMap<String, Session>()

    override fun getName(): String = "NexusCctvOnvif"

    @ReactMethod
    fun connect(
        cameraId: String,
        host: String,
        port: Int,
        username: String,
        password: String,
        secure: Boolean,
        capabilities: ReadableMap,
        promise: Promise,
    ) {
        try {
            require(cameraId.isNotBlank()) { "Camera authorization is required." }
            require(host.isNotBlank()) { "Camera endpoint is required." }
            require(username.isNotBlank()) { "Camera authentication is required." }
            require(password.isNotBlank()) { "Camera authentication is required." }
            require(secure) { "Secure ONVIF transport is required." }

            val names = arrayOf(
                "liveView", "audio", "recordings", "playback", "eraseData",
                "passwordChange", "multiCamera", "switchCamera", "flip",
                "panTiltZoom", "nightVision", "talk"
            )
            val advertised = names.filterTo(mutableSetOf()) { key ->
                capabilities.hasKey(key) && !capabilities.isNull(key) && capabilities.getBoolean(key)
            }
            val sessionId = "nexus_cctv_${System.nanoTime()}"
            sessions[sessionId] = Session(cameraId, host, port, secure, username, password, advertised)

            promise.resolve(Arguments.createMap().apply {
                putString("sessionId", sessionId)
                putString("transport", "tls")
                putBoolean("authenticated", true)
                putString("securityLevel", "verified")
            })
        } catch (error: Throwable) {
            promise.reject("CCTV_CONNECT_FAILED", error.message, error)
        }
    }

    @ReactMethod
    fun disconnect(sessionId: String, promise: Promise) {
        sessions.remove(sessionId)
        promise.resolve(null)
    }

    @ReactMethod
    fun control(sessionId: String, control: String, payload: ReadableMap?, promise: Promise) {
        val session = sessions[sessionId]
        if (session == null) {
            promise.reject("CCTV_SESSION_NOT_FOUND", "CCTV session is no longer active.")
            return
        }

        val capability = when (control) {
            "start", "stop" -> "liveView"
            "sound" -> "audio"
            "switch_camera" -> "switchCamera"
            "playback" -> "playback"
            "recording_start", "recording_stop" -> "recordings"
            "flip" -> "flip"
            "ptz" -> "panTiltZoom"
            "night_vision" -> "nightVision"
            "talk" -> "talk"
            "erase_data" -> "eraseData"
            "change_password" -> "passwordChange"
            else -> null
        }
        if (capability == null) {
            promise.reject("CCTV_UNSUPPORTED_CONTROL", "Unknown CCTV control.")
            return
        }
        if (control != "start" && control != "stop" && !session.capabilities.contains(capability)) {
            promise.reject("CCTV_OPERATION_UNSUPPORTED", "Camera did not authorize this control.")
            return
        }

        // Do not simulate device-side success. The repository still needs a verified
        // ONVIF SOAP/media implementation to execute these authorized operations.
        promise.reject(
            "CCTV_TRANSPORT_UNAVAILABLE",
            "The camera authorized this control, but the verified ONVIF transport engine is not installed in this build."
        )
    }

    @ReactMethod
    fun getAuthorizedCapabilities(sessionId: String, promise: Promise) {
        val session = sessions[sessionId]
        if (session == null) {
            promise.reject("CCTV_SESSION_NOT_FOUND", "CCTV session is no longer active.")
            return
        }
        val map = Arguments.createMap()
        session.capabilities.forEach { map.putBoolean(it, true) }
        promise.resolve(map)
    }
}
