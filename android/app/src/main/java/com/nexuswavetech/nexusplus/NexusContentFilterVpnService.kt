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
 * Stage 2: user-consented local VPN foundation.
 *
 * Android permits only one active VPN connection per user at a time. This
 * service therefore remains optional and does not attempt to replace or stack
 * another VPN provider. Packet classification/forwarding is intentionally not
 * performed here until the complete packet engine is available.
 */
class NexusContentFilterVpnService : VpnService() {
    private var vpnInterface: android.os.ParcelFileDescriptor? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            stopSelf()
            return START_NOT_STICKY
        }

        startForeground(NOTIFICATION_ID, buildNotification())
        establishVpn()
        return START_STICKY
    }

    override fun onDestroy() {
        closeVpn()
        super.onDestroy()
    }

    override fun onRevoke() {
        closeVpn()
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

    private fun closeVpn() {
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
