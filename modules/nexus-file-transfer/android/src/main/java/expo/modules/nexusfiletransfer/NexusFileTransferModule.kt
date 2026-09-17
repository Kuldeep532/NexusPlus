package expo.modules.nexusfiletransfer

import android.content.Context
import android.net.Uri
import com.google.android.gms.nearby.Nearby
import com.google.android.gms.nearby.connection.*
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.security.MessageDigest
import java.util.concurrent.ConcurrentHashMap

class NexusFileTransferModule : Module() {
  private val serviceId = "com.nexuswavetech.nexusplus.filetransfer"
  private val strategy = Strategy.P2P_POINT_TO_POINT
  private var mode = "idle"
  private var connectedEndpoint: String? = null
  private val devices = ConcurrentHashMap<String, String>()
  private val pending = ConcurrentHashMap<String, Map<String, String>>()
  private val incoming = ConcurrentHashMap<Long, Payload>()
  private val incomingMeta = ConcurrentHashMap<Long, Map<String, String>>()
  private var progress = 0L
  private var progressTotal = 0L
  private var status = "idle"
  private var error: String? = null
  private val received = mutableListOf<Map<String, Any?>>()

  private val payloadCallback = object : PayloadCallback() {
    override fun onPayloadReceived(endpointId: String, payload: Payload) {
      if (payload.type == Payload.Type.BYTES) {
        try {
          val json = JSONObject(String(payload.asBytes(), Charsets.UTF_8))
          if (json.optString("kind") == "file-meta") {
            incomingMeta[json.getLong("payloadId")] = mapOf(
              "name" to json.optString("name", "received-file"),
              "mime" to json.optString("mime", "application/octet-stream"),
              "size" to json.optString("size", "0"),
              "sha256" to json.optString("sha256", "")
            )
          }
        } catch (_: Exception) { }
      } else if (payload.type == Payload.Type.FILE) {
        incoming[payload.id] = payload
        progressTotal = payload.asFile().size
      }
    }

    override fun onPayloadTransferUpdate(endpointId: String, update: PayloadTransferUpdate) {
      progress = update.bytesTransferred
      if (update.status == PayloadTransferUpdate.Status.SUCCESS) {
        val payload = incoming.remove(update.payloadId)
        if (payload != null && payload.type == Payload.Type.FILE) {
          processReceivedFile(update.payloadId, payload)
        }
      } else if (update.status == PayloadTransferUpdate.Status.ERROR) {
        status = "transfer_failed"
        error = "File transfer failed."
      }
    }
  }

  private val lifecycleCallback = object : ConnectionLifecycleCallback() {
    override fun onConnectionInitiated(endpointId: String, info: ConnectionInfo) {
      pending[endpointId] = mapOf("name" to info.endpointName, "code" to info.authenticationDigits)
      // Sender-side connection is accepted automatically. Receiver must explicitly accept after
      // seeing the authentication code in the accessible UI.
      if (mode == "send") {
        Nearby.getConnectionsClient(context()).acceptConnection(endpointId, payloadCallback)
      }
      status = "connection_pending"
    }

    override fun onConnectionResult(endpointId: String, result: ConnectionResolution) {
      pending.remove(endpointId)
      if (result.status.isSuccess) {
        connectedEndpoint = endpointId
        status = "connected"
        if (mode == "send") sendQueuedFile()
      } else {
        status = "connection_failed"
        error = "The connection was rejected or could not be established."
      }
    }

    override fun onDisconnected(endpointId: String) {
      if (connectedEndpoint == endpointId) connectedEndpoint = null
      status = "disconnected"
    }
  }

  private var queuedFile: Map<String, String>? = null

  override fun definition() = ModuleDefinition {
    Name("NexusFileTransfer")

    AsyncFunction("start") { role: String, promise: Promise ->
      try {
        stopInternal()
        mode = role
        status = "starting"
        error = null
        val client = Nearby.getConnectionsClient(context())
        if (role == "receive") {
          client.startAdvertising(
            android.os.Build.MODEL,
            serviceId,
            lifecycleCallback,
            AdvertisingOptions.Builder().setStrategy(strategy).build()
          ).addOnSuccessListener { status = "ready" }
           .addOnFailureListener { status = "error"; error = it.message ?: "Unable to start receiving." }
        } else {
          client.startDiscovery(
            serviceId,
            object : EndpointDiscoveryCallback() {
              override fun onEndpointFound(endpointId: String, info: DiscoveredEndpointInfo) {
                devices[endpointId] = info.endpointName
              }
              override fun onEndpointLost(endpointId: String) { devices.remove(endpointId) }
            },
            DiscoveryOptions.Builder().setStrategy(strategy).build()
          ).addOnSuccessListener { status = "ready" }
           .addOnFailureListener { status = "error"; error = it.message ?: "Unable to find nearby devices." }
        }
        promise.resolve(true)
      } catch (e: Exception) {
        status = "error"; error = e.message ?: "Unable to start file transfer."; promise.reject("START_FAILED", error, e)
      }
    }

    AsyncFunction("connect") { endpointId: String, promise: Promise ->
      Nearby.getConnectionsClient(context()).requestConnection(android.os.Build.MODEL, endpointId, lifecycleCallback)
        .addOnSuccessListener { status = "connection_requested"; promise.resolve(true) }
        .addOnFailureListener { error = it.message ?: "Unable to connect."; status = "error"; promise.reject("CONNECT_FAILED", error, it) }
    }

    AsyncFunction("accept") { endpointId: String, promise: Promise ->
      Nearby.getConnectionsClient(context()).acceptConnection(endpointId, payloadCallback)
        .addOnSuccessListener { pending.remove(endpointId); promise.resolve(true) }
        .addOnFailureListener { promise.reject("ACCEPT_FAILED", it.message ?: "Unable to accept connection.", it) }
    }

    AsyncFunction("reject") { endpointId: String, promise: Promise ->
      Nearby.getConnectionsClient(context()).rejectConnection(endpointId)
        .addOnSuccessListener { pending.remove(endpointId); promise.resolve(true) }
        .addOnFailureListener { promise.reject("REJECT_FAILED", it.message ?: "Unable to reject connection.", it) }
    }

    AsyncFunction("queueFile") { uriString: String, name: String, mime: String, promise: Promise ->
      try {
        val meta = validateSource(uriString, name, mime)
        queuedFile = meta
        status = "file_ready"
        promise.resolve(meta)
      } catch (e: Exception) {
        error = e.message ?: "This file type is not allowed."; status = "blocked"; promise.reject("UNSAFE_FILE", error, e)
      }
    }

    AsyncFunction("getState") { promise: Promise -> promise.resolve(stateMap()) }

    AsyncFunction("stop") { promise: Promise ->
      stopInternal(); promise.resolve(true)
    }
  }

  private fun context(): Context = requireNotNull(appContext.reactContext)

  private fun validateSource(uriString: String, name: String, mime: String): Map<String, String> {
    val safe = setOf(
      "pdf","jpg","jpeg","png","gif","webp","txt","md","csv","json",
      "mp3","wav","m4a","aac","ogg","flac","mp4","m4v","mov","webm",
      "docx","xlsx","pptx","epub"
    )
    val cleanName = name.substringAfterLast('/').replace(Regex("[^A-Za-z0-9._ -]"), "_")
    val ext = cleanName.substringAfterLast('.', "").lowercase()
    require(ext in safe) { "Blocked file type. Nexus Plus only sends trusted document, image, audio and video formats." }
    val uri = Uri.parse(uriString)
    val resolver = context().contentResolver
    val size = resolver.openAssetFileDescriptor(uri, "r")?.use { it.length } ?: -1L
    require(size in 1..(2L * 1024 * 1024 * 1024)) { "File is empty or larger than 2 GB." }
    val sha = sha256(uri)
    return mapOf("uri" to uriString, "name" to cleanName, "mime" to mime, "size" to size.toString(), "sha256" to sha)
  }

  private fun sha256(uri: Uri): String {
    val md = MessageDigest.getInstance("SHA-256")
    context().contentResolver.openInputStream(uri).use { input ->
      requireNotNull(input) { "Unable to read selected file." }
      val buffer = ByteArray(1024 * 64)
      var n: Int
      while (input.read(buffer).also { n = it } >= 0) if (n > 0) md.update(buffer, 0, n)
    }
    return md.digest().joinToString("") { "%02x".format(it) }
  }

  private fun sendQueuedFile() {
    val endpoint = connectedEndpoint ?: return
    val meta = queuedFile ?: return
    try {
      val pfd = context().contentResolver.openFileDescriptor(Uri.parse(meta["uri"]), "r")
        ?: throw IllegalStateException("Unable to open file.")
      val filePayload = Payload.fromFile(pfd)
      val message = JSONObject().apply {
        put("kind", "file-meta")
        put("payloadId", filePayload.id)
        put("name", meta["name"])
        put("mime", meta["mime"])
        put("size", meta["size"])
        put("sha256", meta["sha256"])
      }.toString().toByteArray(Charsets.UTF_8)
      status = "sending"
      Nearby.getConnectionsClient(context()).sendPayload(endpoint, Payload.fromBytes(message))
      Nearby.getConnectionsClient(context()).sendPayload(endpoint, filePayload)
    } catch (e: Exception) {
      status = "error"; error = e.message ?: "Unable to send file."
    }
  }

  private fun processReceivedFile(id: Long, payload: Payload) {
    val meta = incomingMeta.remove(id) ?: run { payload.close(); return }
    try {
      val name = meta["name"] ?: "received-file"
      val ext = name.substringAfterLast('.', "").lowercase()
      val allowed = ext in setOf("pdf","jpg","jpeg","png","gif","webp","txt","md","csv","json","mp3","wav","m4a","aac","ogg","flac","mp4","m4v","mov","webm","docx","xlsx","pptx","epub")
      require(allowed) { "Received file type is blocked." }
      val expectedSize = meta["size"]?.toLongOrNull() ?: -1L
      require(expectedSize == payload.asFile().size) { "Received file size does not match." }
      val source = payload.asFile().asUri()
      val out = File(context().filesDir, "received")
      out.mkdirs()
      val destination = File(out, name)
      context().contentResolver.openInputStream(source).use { input ->
        requireNotNull(input) { "Unable to read received file." }
        FileOutputStream(destination).use { output -> input.copyTo(output) }
      }
      val actualSha = sha256(Uri.fromFile(destination))
      require(actualSha.equals(meta["sha256"], true)) { "File integrity check failed. The file was not accepted." }
      received.add(mapOf("name" to name, "path" to destination.absolutePath, "mime" to meta["mime"], "size" to expectedSize))
      status = "received"
      progress = expectedSize
      progressTotal = expectedSize
      context().contentResolver.delete(source, null, null)
    } catch (e: Exception) {
      status = "blocked"
      error = e.message ?: "The received file failed safety checks and was discarded."
      try { context().contentResolver.delete(payload.asFile().asUri(), null, null) } catch (_: Exception) { }
    } finally { payload.close() }
  }

  private fun stateMap(): Map<String, Any?> = mapOf(
    "mode" to mode,
    "status" to status,
    "error" to error,
    "devices" to devices.map { mapOf("id" to it.key, "name" to it.value) },
    "pending" to pending.map { mapOf("id" to it.key, "name" to it.value["name"], "code" to it.value["code"]) },
    "connected" to (connectedEndpoint != null),
    "progress" to progress,
    "total" to progressTotal,
    "received" to received.toList()
  )

  private fun stopInternal() {
    try { Nearby.getConnectionsClient(context()).stopAdvertising() } catch (_: Exception) { }
    try { Nearby.getConnectionsClient(context()).stopDiscovery() } catch (_: Exception) { }
    try { Nearby.getConnectionsClient(context()).stopAllEndpoints() } catch (_: Exception) { }
    devices.clear(); pending.clear(); connectedEndpoint = null; queuedFile = null
    progress = 0; progressTotal = 0; mode = "idle"; status = "idle"; error = null
  }
}
