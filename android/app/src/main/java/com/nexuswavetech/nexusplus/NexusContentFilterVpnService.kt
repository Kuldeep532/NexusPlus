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
import java.nio.ByteBuffer
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.concurrent.thread

/**
 * Local, user-consented VPN protection service.
 *
 * This stage intentionally runs in DNS-protection mode rather than installing
 * a default route. A full IP forwarding/NAT engine is not present yet, so a
 * default route would unnecessarily break all non-DNS traffic.
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

        if (prepare(this) != null) {
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
                .addAddress(VPN_ADDRESS, 32)
                .addRoute(VPN_DNS_ADDRESS, 32)
                .addDnsServer(VPN_DNS_ADDRESS)
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
        packetThread = thread(name = "NexusVpnDnsLoop", isDaemon = true) {
            val input = runCatching { FileInputStream(interfaceFd.fileDescriptor) }.getOrNull()
            if (input == null) {
                stopProtection()
                return@thread
            }

            val buffer = ByteBuffer.allocate(MAX_PACKET_SIZE)
            try {
                while (running.get() && NexusVpnPolicy.isEnabled(this)) {
                    buffer.clear()
                    val read = input.read(buffer.array())
                    if (read <= 0) break
                    if (read > MAX_PACKET_SIZE) break

                    // The current safe mode only classifies DNS packets. Other
                    // routed protocols are not intercepted because the VPN does
                    // not yet contain a complete forwarding implementation.
                    NexusVpnDnsPacketHandler.handle(this, interfaceFd, buffer.array(), read)
                }
            } catch (_: Throwable) {
                // Closing the descriptor restores networking automatically.
            } finally {
                runCatching { input.close() }
                running.set(false)
            }
        }
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
            .setContentText("Local DNS protection is active.")
            .setOngoing(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build()

    companion object {
        const val ACTION_START = "com.nexuswavetech.nexusplus.action.START_CONTENT_FILTER_VPN"
        const val ACTION_STOP = "com.nexuswavetech.nexusplus.action.STOP_CONTENT_FILTER_VPN"
        const val VPN_ADDRESS = "10.231.0.2"
        const val VPN_DNS_ADDRESS = "10.231.0.1"
        private const val CHANNEL_ID = "nexus_content_protection"
        private const val NOTIFICATION_ID = 4107
        private const val MTU = 1500
        private const val MAX_PACKET_SIZE = 64 * 1024
    }
}
