package com.nexuswavetech.nexusplus

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.IBinder
import android.os.ParcelFileDescriptor
import androidx.core.app.NotificationCompat
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.InetSocketAddress
import java.net.Socket
import java.nio.ByteBuffer
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.concurrent.thread

/**
 * Local, user-consented VPN protection service.
 *
 * This stage hardens the existing VPN foundation with:
 * - explicit VPN consent validation;
 * - fail-closed startup when consent is missing or revoked;
 * - a dedicated packet loop so the TUN descriptor is actually consumed;
 * - bounded packet-buffer handling and graceful shutdown;
 * - no remote tunnel or plaintext traffic logging.
 *
 * The service is intentionally not presented as universal HTTPS content
 * inspection. Domain/content filtering is added only when a complete parser
 * and forwarding path is available.
 */
class NexusContentFilterVpnService : VpnService() {
    private var vpnInterface: ParcelFileDescriptor? = null
    private var packetThread: Thread? = null
    private val running = AtomicBoolean(false)

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            stopProtection()
            stopSelf()
            return START_NOT_STICKY
        }

        if (!NexusVpnPolicy.hasConsent(this)) {
            stopProtection()
            stopSelf()
            return START_NOT_STICKY
        }

        val prepared = prepare(this)
        if (prepared != null) {
            stopProtection()
            stopSelf()
            return START_NOT_STICKY
        }

        startForeground(NOTIFICATION_ID, buildNotification())
        establishVpn()
        return START_STICKY
    }

    override fun onDestroy() {
        stopProtection()
        super.onDestroy()
    }

    override fun onRevoke() {
        NexusVpnPolicy.setEnabled(this, false)
        stopProtection()
        stopSelf()
    }

    override fun onBind(intent: Intent?): IBinder? = super.onBind(intent)

    @Synchronized
    private fun establishVpn() {
        if (vpnInterface != null || !running.compareAndSet(false, true)) return

        val established = runCatching {
            Builder()
                .setSession("Nexus Content Protection")
                .setMtu(MTU)
                .addAddress("10.231.0.2", 32)
                .addRoute("0.0.0.0", 0)
                .addDnsServer("10.231.0.1")
                .setBlocking(false)
                .establish()
        }.getOrNull()

        if (established == null) {
            running.set(false)
            stopSelf()
            return
        }

        vpnInterface = established
        startPacketLoop(established)
    }

    private fun startPacketLoop(interfaceFd: ParcelFileDescriptor) {
        packetThread?.interrupt()
        packetThread = thread(
            name = "NexusVpnPacketLoop",
            isDaemon = true,
        ) {
            val input = runCatching { FileInputStream(interfaceFd.fileDescriptor) }.getOrNull()
            val output = runCatching { FileOutputStream(interfaceFd.fileDescriptor) }.getOrNull()

            if (input == null || output == null) {
                stopProtection()
                return@thread
            }

            val buffer = ByteBuffer.allocate(MAX_PACKET_SIZE)
            try {
                while (running.get() && NexusVpnPolicy.isEnabled(this)) {
                    buffer.clear()
                    val read = input.read(buffer.array())
                    if (read <= 0) break

                    // Baseline safety invariant: never inject malformed/oversized
                    // data back into the TUN device. Packet classification and
                    // forwarding are deliberately separate from this lifecycle stage.
                    if (read > MAX_PACKET_SIZE) break

                    if (shouldAllowRawPacket(buffer.array(), read)) {
                        // No forwarding backend exists yet. Do not pretend to have
                        // delivered packets to the Internet; fail closed for this
                        // foundation instead of silently leaking traffic.
                        continue
                    }
                }
            } catch (_: Throwable) {
                // Network restoration is handled by closing the VPN descriptor.
            } finally {
                runCatching { input.close() }
                runCatching { output.close() }
                running.set(false)
            }
        }
    }

    /** Baseline guard. Full IP/DNS classification will be introduced separately. */
    private fun shouldAllowRawPacket(packet: ByteArray, length: Int): Boolean {
        if (length < IPV4_MIN_HEADER) return false
        val version = (packet[0].toInt() ushr 4) and 0x0f
        return version == 4
    }

    @Synchronized
    private fun stopProtection() {
        running.set(false)
        packetThread?.interrupt()
        packetThread = null
        vpnInterface?.close()
        vpnInterface = null
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(
            NotificationChannel(
                CHANNEL_ID,
                "Nexus Content Protection",
                NotificationManager.IMPORTANCE_LOW,
            ),
        )
    }

    private fun buildNotification(): Notification =
        NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setContentTitle("Nexus Content Protection")
            .setContentText("Local protection service is active.")
            .setOngoing(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build()

    companion object {
        const val ACTION_START = "com.nexuswavetech.nexusplus.action.START_CONTENT_FILTER_VPN"
        const val ACTION_STOP = "com.nexuswavetech.nexusplus.action.STOP_CONTENT_FILTER_VPN"
        private const val CHANNEL_ID = "nexus_content_protection"
        private const val NOTIFICATION_ID = 4107
        private const val MTU = 1500
        private const val IPV4_MIN_HEADER = 20
        private const val MAX_PACKET_SIZE = 64 * 1024
    }
}
