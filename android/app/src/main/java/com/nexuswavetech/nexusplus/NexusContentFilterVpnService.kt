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
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.concurrent.thread

/** User-consented local DNS protection VPN. */
class NexusContentFilterVpnService : VpnService() {
    private var vpnInterface: ParcelFileDescriptor? = null
    private var packetThread: Thread? = null
    private val running = AtomicBoolean(false)

    override fun onCreate() { super.onCreate(); createNotificationChannel() }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) { stopProtection(); stopSelf(); return START_NOT_STICKY }
        if (!NexusVpnPolicy.hasConsent(this)) {
            NexusVpnPolicy.setEnabled(this, false)
            stopProtection()
            stopSelf()
            return START_NOT_STICKY
        }
        if (prepare(this) != null) {
            NexusVpnPolicy.setEnabled(this, false)
            stopProtection()
            stopSelf()
            return START_NOT_STICKY
        }
        NexusVpnPolicy.setEnabled(this, true)
        startForeground(NOTIFICATION_ID, buildNotification())
        establishVpn()
        return START_STICKY
    }

    override fun onDestroy() { NexusVpnPolicy.setEnabled(this, false); stopProtection(); super.onDestroy() }
    override fun onRevoke() { NexusVpnPolicy.setEnabled(this, false); stopProtection(); stopSelf() }
    override fun onBind(intent: Intent?): IBinder? = super.onBind(intent)

    @Synchronized private fun establishVpn() {
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
            NexusVpnPolicy.setEnabled(this, false)
            running.set(false)
            stopSelf()
            return
        }
        vpnInterface = established
        startPacketLoop(established)
    }

    private fun startPacketLoop(interfaceFd: ParcelFileDescriptor) {
        packetThread?.interrupt()
        packetThread = thread(name = "NexusVpnPacketLoop", isDaemon = true) {
            val input = runCatching { FileInputStream(interfaceFd.fileDescriptor) }.getOrNull()
            if (input == null) {
                NexusVpnPacketStats.recordDropped()
                NexusVpnPolicy.setEnabled(this, false)
                stopProtection()
                return@thread
            }
            val buffer = ByteArray(MAX_PACKET_SIZE)
            try {
                while (running.get() && NexusVpnPolicy.isEnabled(this)) {
                    val read = input.read(buffer)
                    if (read <= 0) break
                    NexusVpnPacketStats.recordIn()
                    dispatchPacket(interfaceFd, buffer, read)
                }
            } catch (_: Throwable) {
                NexusVpnPacketStats.recordDropped()
            } finally {
                runCatching { input.close() }
                running.set(false)
            }
        }
    }

    private fun dispatchPacket(interfaceFd: ParcelFileDescriptor, packet: ByteArray, length: Int) {
        when (NexusVpnTrafficDecision.decide(NexusVpnPacketInspector.inspect(packet, length).kind)) {
            NexusVpnTrafficDecision.Action.HANDLE_DNS ->
                NexusVpnDnsPacketHandler.handle(this, interfaceFd, packet, length)
            NexusVpnTrafficDecision.Action.FORWARD_TCP,
            NexusVpnTrafficDecision.Action.FORWARD_UDP,
            NexusVpnTrafficDecision.Action.IGNORE_OTHER_IPV4 ->
                NexusVpnPacketStats.recordNonDns()
            NexusVpnTrafficDecision.Action.DROP_INVALID ->
                NexusVpnPacketStats.recordDropped()
        }
    }

    @Synchronized private fun stopProtection() {
        running.set(false)
        packetThread?.interrupt()
        packetThread = null
        vpnInterface?.close()
        vpnInterface = null
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        getSystemService(NotificationManager::class.java).createNotificationChannel(
            NotificationChannel(CHANNEL_ID, "Nexus Content Protection", NotificationManager.IMPORTANCE_LOW),
        )
    }

    private fun buildNotification(): Notification = NotificationCompat.Builder(this, CHANNEL_ID)
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
