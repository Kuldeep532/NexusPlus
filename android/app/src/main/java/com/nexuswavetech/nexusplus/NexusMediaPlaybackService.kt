package com.nexuswavetech.nexusplus

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

/** Foreground lifecycle + notification surface for the single JS/Expo audio engine. */
class NexusMediaPlaybackService : Service() {
    companion object {
        const val ACTION_PAUSE = "com.nexuswavetech.nexusplus.media.PAUSE"
        const val ACTION_RESUME = "com.nexuswavetech.nexusplus.media.RESUME"
        const val ACTION_STOP = "com.nexuswavetech.nexusplus.media.STOP"
        const val ACTION_UPDATE = "com.nexuswavetech.nexusplus.media.UPDATE"
        const val EXTRA_TITLE = "title"
        const val EXTRA_ARTIST = "artist"
        const val EXTRA_PLAYING = "playing"
        private const val CHANNEL_ID = "nexus-media-playback"
        private const val NOTIFICATION_ID = 4102
    }

    private var title = "Nexus Plus"
    private var artist = "Media Player"
    private var playing = false

    private val commandReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            sendBroadcast(Intent(intent.action ?: return).setPackage(packageName))
            if (intent.action == ACTION_STOP) stopPlaybackSurface()
        }
    }

    override fun onCreate() {
        super.onCreate()
        createChannel()
        registerReceiverCompat(commandReceiver, IntentFilter().apply {
            addAction(ACTION_PAUSE)
            addAction(ACTION_RESUME)
            addAction(ACTION_STOP)
        })
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_UPDATE -> {
                title = intent.getStringExtra(EXTRA_TITLE)?.trim()?.take(200).orEmpty().ifBlank { "Nexus Plus" }
                artist = intent.getStringExtra(EXTRA_ARTIST)?.trim()?.take(200).orEmpty().ifBlank { "Media Player" }
                playing = intent.getBooleanExtra(EXTRA_PLAYING, false)
                startForegroundCompat()
                updateNotification()
            }
        }
        return START_NOT_STICKY
    }

    private fun startForegroundCompat() {
        val notification = buildNotification()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    private fun buildNotification(): Notification {
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
        val contentIntent = PendingIntent.getActivity(this, 0, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val pauseAction = if (playing) ACTION_PAUSE else ACTION_RESUME
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentTitle(title)
            .setContentText(artist)
            .setContentIntent(contentIntent)
            .setOngoing(playing)
            .setOnlyAlertOnce(true)
            .setCategory(NotificationCompat.CATEGORY_TRANSPORT)
            .addAction(if (playing) android.R.drawable.ic_media_pause else android.R.drawable.ic_media_play, if (playing) "Pause" else "Play", servicePendingIntent(pauseAction, 1))
            .addAction(android.R.drawable.ic_media_stop, "Stop", servicePendingIntent(ACTION_STOP, 2))
            .build()
    }

    private fun servicePendingIntent(action: String, requestCode: Int): PendingIntent =
        PendingIntent.getService(this, requestCode, Intent(this, NexusMediaPlaybackService::class.java).setAction(action), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

    private fun updateNotification() {
        runCatching { getSystemService(NotificationManager::class.java)?.notify(NOTIFICATION_ID, buildNotification()) }
    }

    private fun stopPlaybackSurface() {
        runCatching { stopForeground(STOP_FOREGROUND_REMOVE) }
        stopSelf()
    }

    private fun createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getSystemService(NotificationManager::class.java)?.createNotificationChannel(
                NotificationChannel(CHANNEL_ID, "Media playback", NotificationManager.IMPORTANCE_LOW),
            )
        }
    }

    private fun registerReceiverCompat(receiver: BroadcastReceiver, filter: IntentFilter) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) registerReceiver(receiver, filter, RECEIVER_NOT_EXPORTED)
        else {
            @Suppress("DEPRECATION")
            registerReceiver(receiver, filter)
        }
    }

    override fun onDestroy() {
        runCatching { unregisterReceiver(commandReceiver) }
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
