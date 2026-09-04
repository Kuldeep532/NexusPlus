package com.nexuswavetech.nexusplus

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

/**
 * Stage 2: local loopback VPN foundation.
 *
 * The service establishes a local TUN interface after Android grants VPN
 * consent. Packet parsing/DNS forwarding is deliberately kept in the native
 * engine boundary so the policy remains on-device.
 */
class NexusContentFilterVpnService : VpnService() {
    private var vpnInterface: android.os.ParcelFileDescriptor? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIFICATION_ID, buildNotification())
        establishVpn()
        return START_STICKY
    }

    override fun onDestroy() {
        vpnInterface?.close()
        vpnInterface = null
        super.onDestroy()
    }

    override fun onRevoke() {
        vpnInterface?.close()
        vpnInterface = null
        stopSelf()
    }

    override fun onBind(intent: Intent?): IBinder? = super.onBind(intent)

    private fun establishVpn() {
        if (vpnInterface != null) return

        vpnInterface = Builder()
            .setSession("Nexus Content Protection")
            .setMtu(1500)
            .addAddress("10.231.0.2", 32)
            .addRoute("0.0.0.0", 0)
            .addDnsServer("10.231.0.1")
            .establish()
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
            .setContentText("Local protection is active on this device.")
            .setOngoing(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build()

    companion object {
        const val ACTION_START = "com.nexuswavetech.nexusplus.action.START_CONTENT_FILTER_VPN"
        const val ACTION_STOP = "com.nexuswavetech.nexusplus.action.STOP_CONTENT_FILTER_VPN"
        private const val CHANNEL_ID = "nexus_content_protection"
        private const val NOTIFICATION_ID = 4107
    }
}
