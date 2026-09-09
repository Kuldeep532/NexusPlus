package com.nexuswavetech.nexusplus

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import java.net.HttpURLConnection
import java.net.URL
import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.security.SecureRandom
import java.time.Instant
import java.util.Base64
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

/** Real ONVIF SOAP transport. Unsupported operations fail closed. */
class NexusCctvOnvifModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private data class RecordingRef(val recordingToken: String, val createdAt: Long)
    private data class Session(
        val cameraId: String, val host: String, val port: Int, val username: String,
        var password: String, val deviceXaddr: String, val mediaXaddr: String?, val media2Xaddr: String?,
        val ptzXaddr: String?, val recordingXaddr: String?, val searchXaddr: String?, val replayXaddr: String?,
        var profileToken: String?, var recordingRef: RecordingRef?, val capabilities: Set<String>
    )
    private data class Services(val media: String?, val media2: String?, val ptz: String?, val recording: String?, val search: String?, val replay: String?)
    private val sessions = ConcurrentHashMap<String, Session>()

    override fun getName() = "NexusCctvOnvif"

    @ReactMethod
    fun connect(cameraId: String, host: String, port: Int, username: String, password: String, secure: Boolean, capabilities: ReadableMap, promise: Promise) {
        try {
            require(cameraId.isNotBlank()) { "Camera authorization is required." }
            require(host.isNotBlank() && port in 1..65535) { "Camera endpoint is invalid." }
            require(username.isNotBlank() && password.isNotBlank()) { "Camera authentication is required." }
            require(secure) { "Secure ONVIF transport is required." }
            val caps = CAPABILITY_KEYS.filterTo(mutableSetOf()) { capabilities.hasKey(it) && !capabilities.isNull(it) && capabilities.getBoolean(it) }
            val base = "https://$host:$port"
            val device = resolveDeviceService(base, username, password)
            val services = getServices(device, username, password)
            val session = Session(cameraId, host, port, username, password, device, services.media, services.media2, services.ptz, services.recording, services.search, services.replay, null, null, caps)
            session.profileToken = getProfileToken(session)
            val id = "nexus_cctv_${UUID.randomUUID()}"
            sessions[id] = session
            val stream = runCatching { getStreamUri(session) }.getOrNull()
            promise.resolve(Arguments.createMap().apply {
                putString("sessionId", id)
                putString("transport", "https")
                putBoolean("authenticated", true)
                putString("securityLevel", "verified")
                if (stream != null) putString("streamUri", stream)
            })
        } catch (e: Throwable) {
            promise.reject("CCTV_CONNECT_FAILED", safeError(e), e)
        }
    }

    @ReactMethod
    fun disconnect(sessionId: String, promise: Promise) {
        sessions.remove(sessionId)?.password = ""
        promise.resolve(null)
    }

    @ReactMethod
    fun control(sessionId: String, control: String, payload: ReadableMap?, promise: Promise) {
        val s = sessions[sessionId] ?: return promise.reject("CCTV_SESSION_NOT_FOUND", "CCTV session is no longer active.")
        try {
            when (control) {
                "start" -> { cap(s, "liveView"); val uri = getStreamUri(s); promise.resolve(Arguments.createMap().apply { putString("streamUri", uri) }) }
                "stop" -> promise.resolve(null)
                "playback" -> { cap(s, "playback"); val uri = getReplayUri(s, payload); promise.resolve(Arguments.createMap().apply { putString("streamUri", uri) }) }
                "recording_start" -> { cap(s, "recordings"); val ref = createRecording(s); s.recordingRef = ref; promise.resolve(Arguments.createMap().apply { putString("recordingToken", ref.recordingToken) }) }
                "recording_stop" -> { cap(s, "recordings"); stopRecording(s); promise.resolve(null) }
                "erase_data" -> { cap(s, "eraseData"); eraseRecordings(s, payload); promise.resolve(null) }
                "change_password" -> { cap(s, "passwordChange"); changePassword(s, payload); promise.resolve(null) }
                "ptz" -> { cap(s, "panTiltZoom"); ptz(s, payload); promise.resolve(null) }
                "sound", "switch_camera", "flip", "night_vision", "talk" -> throw UnsupportedOperationException("This ONVIF control requires a verified device capability implementation.")
                else -> throw IllegalArgumentException("Unknown CCTV control.")
            }
        } catch (e: Throwable) {
            promise.reject("CCTV_OPERATION_FAILED", safeError(e), e)
        }
    }

    @ReactMethod
    fun getAuthorizedCapabilities(sessionId: String, promise: Promise) {
        val s = sessions[sessionId] ?: return promise.reject("CCTV_SESSION_NOT_FOUND", "CCTV session is no longer active.")
        promise.resolve(Arguments.createMap().apply { s.capabilities.forEach { putBoolean(it, true) } })
    }

    private fun cap(s: Session, key: String) {
        if (key != "liveView" && !s.capabilities.contains(key)) throw IllegalStateException("Camera did not authorize this control.")
    }

    private fun resolveDeviceService(base: String, u: String, p: String): String {
        val candidates = listOf("$base/onvif/device_service", "$base/onvif/device_service/")
        for (candidate in candidates) {
            try {
                soap(candidate, ACTION_GET_SERVICES, "<GetServices xmlns=\"http://www.onvif.org/ver10/device/wsdl\"><IncludeCapability>true</IncludeCapability></GetServices>", u, p)
                return candidate
            } catch (_: Throwable) { }
        }
        throw IllegalStateException("ONVIF device service is unavailable at the authorized endpoint.")
    }

    private fun getServices(device: String, u: String, p: String): Services {
        val x = soap(device, ACTION_GET_SERVICES, "<GetServices xmlns=\"http://www.onvif.org/ver10/device/wsdl\"><IncludeCapability>true</IncludeCapability></GetServices>", u, p)
        fun find(f: String): String? {
            val epr = Regex("(?is)<(?:[A-Za-z0-9_.-]+:)?Namespace>[^<]*$f[^<]*</(?:[A-Za-z0-9_.-]+:)?Namespace>.*?<EPR>.*?<(?:[A-Za-z0-9_.-]+:)?Address>(.*?)</(?:[A-Za-z0-9_.-]+:)?Address>").find(x)?.groupValues?.getOrNull(1)
            if (!epr.isNullOrBlank()) return epr.trim()
            return Regex("(?is)<(?:[A-Za-z0-9_.-]+:)?Namespace>[^<]*$f[^<]*</(?:[A-Za-z0-9_.-]+:)?Namespace>.*?<Address>(.*?)</Address>").find(x)?.groupValues?.getOrNull(1)?.trim()
        }
        return Services(find("/media/wsdl"), find("/media2/wsdl"), find("/ptz/wsdl"), find("/recording/wsdl"), find("/search/wsdl"), find("/replay/wsdl"))
    }

    private fun getProfileToken(s: Session): String {
        val ep = s.media2Xaddr ?: s.mediaXaddr ?: throw IllegalStateException("ONVIF media service is unavailable.")
        val ns = if (s.media2Xaddr != null) "http://www.onvif.org/ver20/media/wsdl" else "http://www.onvif.org/ver10/media/wsdl"
        val action = if (s.media2Xaddr != null) "http://www.onvif.org/ver20/media/wsdl/GetProfiles" else "http://www.onvif.org/ver10/media/wsdl/GetProfiles"
        val x = soap(ep, action, "<GetProfiles xmlns=\"$ns\"/>", s.username, s.password)
        return Regex("(?is)<(?:[A-Za-z0-9_.-]+:)?Profiles[^>]*\\btoken=\"([^\"]+)\"").find(x)?.groupValues?.getOrNull(1) ?: throw IllegalStateException("Camera returned no media profile.")
    }

    private fun getStreamUri(s: Session): String {
        val ep = s.media2Xaddr ?: s.mediaXaddr ?: throw IllegalStateException("ONVIF media service is unavailable.")
        val ns = if (s.media2Xaddr != null) "http://www.onvif.org/ver20/media/wsdl" else "http://www.onvif.org/ver10/media/wsdl"
        val action = if (s.media2Xaddr != null) "http://www.onvif.org/ver20/media/wsdl/GetStreamUri" else "http://www.onvif.org/ver10/media/wsdl/GetStreamUri"
        val body = "<GetStreamUri xmlns=\"$ns\"><StreamSetup><Stream>RTP-Unicast</Stream><Transport><Protocol>RTSP</Protocol></Transport></StreamSetup><ProfileToken>${xml(s.profileToken!!)}</ProfileToken></GetStreamUri>"
        return Regex("(?is)<(?:[A-Za-z0-9_.-]+:)?Uri>(.*?)</(?:[A-Za-z0-9_.-]+:)?Uri>").find(soap(ep, action, body, s.username, s.password))?.groupValues?.getOrNull(1)?.trim() ?: throw IllegalStateException("Camera returned no RTSP stream URI.")
    }

    private fun createRecording(s: Session): RecordingRef {
        val ep = s.recordingXaddr ?: throw IllegalStateException("Camera does not expose Recording Control service.")
        val body = "<CreateRecording xmlns=\"http://www.onvif.org/ver10/recording/wsdl\"><RecordingConfiguration><Source><Token>${xml(s.profileToken!!)}</Token></Source></RecordingConfiguration></CreateRecording>"
        val response = soap(ep, "http://www.onvif.org/ver10/recording/wsdl/CreateRecording", body, s.username, s.password)
        val token = Regex("(?is)<(?:[A-Za-z0-9_.-]+:)?RecordingToken>(.*?)</(?:[A-Za-z0-9_.-]+:)?RecordingToken>").find(response)?.groupValues?.getOrNull(1)?.trim() ?: throw IllegalStateException("Camera returned no recording token.")
        return RecordingRef(token, System.currentTimeMillis())
    }

    private fun stopRecording(s: Session) {
        val ep = s.recordingXaddr ?: throw IllegalStateException("Camera does not expose Recording Control service.")
        val token = s.recordingRef?.recordingToken ?: throw IllegalStateException("No active recording is associated with this session.")
        val body = "<SetRecordingJob xmlns=\"http://www.onvif.org/ver10/recording/wsdl\"><JobConfiguration><RecordingToken>${xml(token)}</RecordingToken><Mode>Idle</Mode></JobConfiguration></SetRecordingJob>"
        soap(ep, "http://www.onvif.org/ver10/recording/wsdl/SetRecordingJob", body, s.username, s.password)
        s.recordingRef = null
    }

    private fun eraseRecordings(s: Session, payload: ReadableMap?) {
        val ep = s.recordingXaddr ?: throw IllegalStateException("Camera does not expose Recording Control service.")
        val token = s.recordingRef?.recordingToken ?: payload?.getString("recordingToken") ?: throw IllegalArgumentException("Recording token is required.")
        soap(ep, "http://www.onvif.org/ver10/recording/wsdl/DeleteRecording", "<DeleteRecording xmlns=\"http://www.onvif.org/ver10/recording/wsdl\"><RecordingToken>${xml(token)}</RecordingToken></DeleteRecording>", s.username, s.password)
        if (s.recordingRef?.recordingToken == token) s.recordingRef = null
    }

    private fun getReplayUri(s: Session, payload: ReadableMap?): String {
        val ep = s.replayXaddr ?: throw IllegalStateException("Camera does not expose Replay service.")
        val token = payload?.getString("recordingToken") ?: s.recordingRef?.recordingToken ?: throw IllegalArgumentException("Recording token is required for replay.")
        val body = "<GetReplayUri xmlns=\"http://www.onvif.org/ver10/replay/wsdl\"><RecordingToken>${xml(token)}</RecordingToken><Protocol>RTSP</Protocol></GetReplayUri>"
        return Regex("(?is)<(?:[A-Za-z0-9_.-]+:)?Uri>(.*?)</(?:[A-Za-z0-9_.-]+:)?Uri>").find(soap(ep, "http://www.onvif.org/ver10/replay/wsdl/GetReplayUri", body, s.username, s.password))?.groupValues?.getOrNull(1)?.trim() ?: throw IllegalStateException("Camera returned no replay URI.")
    }

    private fun ptz(s: Session, p: ReadableMap?) {
        val ep = s.ptzXaddr ?: throw IllegalStateException("Camera does not expose PTZ service.")
        val x = p?.getDouble("x") ?: 0.0
        val y = p?.getDouble("y") ?: 0.0
        val z = p?.getDouble("zoom") ?: 0.0
        val body = "<ContinuousMove xmlns=\"http://www.onvif.org/ver20/ptz/wsdl\"><ProfileToken>${xml(s.profileToken!!)}</ProfileToken><Velocity><PanTilt x=\"$x\" y=\"$y\"/><Zoom x=\"$z\"/></Velocity></ContinuousMove>"
        soap(ep, "http://www.onvif.org/ver20/ptz/wsdl/ContinuousMove", body, s.username, s.password)
    }

    private fun changePassword(s: Session, p: ReadableMap?) {
        val np = p?.getString("newPassword") ?: throw IllegalArgumentException("New password is required.")
        require(np.length >= 6) { "New password is too short." }
        val body = "<SetUser xmlns=\"http://www.onvif.org/ver10/device/wsdl\"><User><Username>${xml(s.username)}</Username><Password>${xml(np)}</Password><UserLevel>Administrator</UserLevel></User></SetUser>"
        soap(s.deviceXaddr, ACTION_SET_USER, body, s.username, s.password)
        s.password = np
    }

    private fun soap(ep: String, action: String, body: String, u: String, p: String): String {
        require(ep.startsWith("https://", ignoreCase = true)) { "ONVIF endpoint is not secure." }
        val c = URL(ep).openConnection() as HttpURLConnection
        c.requestMethod = "POST"
        c.connectTimeout = 8000
        c.readTimeout = 12000
        c.doOutput = true
        c.setRequestProperty("Content-Type", "application/soap+xml; charset=utf-8")
        c.setRequestProperty("SOAPAction", action)
        val env = """<?xml version="1.0" encoding="UTF-8"?><s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://www.w3.org/2005/08/addressing"><s:Header><a:Action s:mustUnderstand="1">$action</a:Action><a:MessageID>uuid:${UUID.randomUUID()}</a:MessageID><a:ReplyTo><a:Address>http://www.w3.org/2005/08/addressing/anonymous</a:Address></a:ReplyTo><a:To>${xml(ep)}</a:To>${wsse(u,p)}</s:Header><s:Body>$body</s:Body></s:Envelope>""".trimIndent()
        c.outputStream.use { it.write(env.toByteArray(StandardCharsets.UTF_8)) }
        val code = c.responseCode
        val input = if (code in 200..299) c.inputStream else c.errorStream
        val text = input?.readBytes()?.toString(StandardCharsets.UTF_8).orEmpty()
        c.disconnect()
        if (code !in 200..299 || text.contains(":Fault") || text.contains("<Fault")) throw IllegalStateException("ONVIF request failed: ${fault(text)}")
        return text
    }

    private fun wsse(u: String, p: String): String {
        val nonce = ByteArray(16)
        SecureRandom().nextBytes(nonce)
        val created = Instant.now().toString()
        val digest = MessageDigest.getInstance("SHA-1").digest(nonce + created.toByteArray(StandardCharsets.UTF_8) + p.toByteArray(StandardCharsets.UTF_8))
        val b64 = Base64.getEncoder()
        return "<wsse:Security xmlns:wsse=\"http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd\" xmlns:wsu=\"http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd\"><wsse:UsernameToken><wsse:Username>${xml(u)}</wsse:Username><wsse:Password Type=\"http://docs.oasis-open.org/wss/UsernameToken-Profile-1.1#PasswordDigest\">${b64.encodeToString(digest)}</wsse:Password><wsse:Nonce EncodingType=\"http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary\">${b64.encodeToString(nonce)}</wsse:Nonce><wsu:Created>$created</wsu:Created></wsse:UsernameToken></wsse:Security>"
    }

    private fun fault(x: String) = Regex("(?is)<(?:[A-Za-z0-9_.-]+:)?Text[^>]*>(.*?)</(?:[A-Za-z0-9_.-]+:)?Text>").find(x)?.groupValues?.getOrNull(1)?.trim() ?: "Unknown ONVIF error"
    private fun xml(v: String) = v.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&apos;")
    private fun safeError(e: Throwable) = e.message?.replace(Regex("password|passwd|token|Authorization|UsernameToken", RegexOption.IGNORE_CASE), "credential").orEmpty().ifBlank { "Camera operation failed." }

    companion object {
        private const val ACTION_GET_SERVICES = "http://www.onvif.org/ver10/device/wsdl/GetServices"
        private const val ACTION_SET_USER = "http://www.onvif.org/ver10/device/wsdl/SetUser"
        private val CAPABILITY_KEYS = listOf("liveView", "audio", "recordings", "playback", "eraseData", "passwordChange", "multiCamera", "switchCamera", "flip", "panTiltZoom", "nightVision", "talk")
    }
}
