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
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.MediaPlayer
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

class NexusMediaPlaybackService : Service() {
    companion object {
        const val ACTION_PLAY = "com.nexuswavetech.nexusplus.media.PLAY"
        const val ACTION_PAUSE = "com.nexuswavetech.nexusplus.media.PAUSE"
        const val ACTION_RESUME = "com.nexuswavetech.nexusplus.media.RESUME"
        const val ACTION_STOP = "com.nexuswavetech.nexusplus.media.STOP"
        const val ACTION_SEEK = "com.nexuswavetech.nexusplus.media.SEEK"
        const val EXTRA_URI = "uri"
        const val EXTRA_TITLE = "title"
        const val EXTRA_ARTIST = "artist"
        const val EXTRA_AUTOPLAY = "autoplay"
        const val EXTRA_POSITION_MS = "position_ms"
        private const val CHANNEL_ID = "nexus-media-playback"
        private const val NOTIFICATION_ID = 4102
    }

    private var player: MediaPlayer? = null
    private var audioFocusRequest: AudioFocusRequest? = null
    private var title = "Nexus Plus"
    private var artist = "Media Player"

    private val commandReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            runCatching {
                when (intent.action) {
                    ACTION_PAUSE -> player?.takeIf { it.isPlaying }?.pause()
                    ACTION_RESUME -> player?.takeIf { !it.isPlaying }?.start()
                    ACTION_STOP -> stopPlayback()
                    ACTION_SEEK -> {
                        val requested = intent.getLongExtra(EXTRA_POSITION_MS, 0L)
                        val current = player ?: return@runCatching
                        if (requested >= 0L && current.isPlaying || requested >= 0L) {
                            val duration = current.duration
                            val target = requested.coerceIn(0L, duration.toLong().coerceAtLeast(0L))
                            current.seekTo(target.toInt())
                        }
                    }
                }
                updateNotification()
            }.onFailure {
                stopPlayback()
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        createChannel()
        registerReceiverCompat(commandReceiver, IntentFilter().apply {
            addAction(ACTION_PAUSE)
            addAction(ACTION_RESUME)
            addAction(ACTION_STOP)
            addAction(ACTION_SEEK)
        })
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_PLAY) {
            title = intent.getStringExtra(EXTRA_TITLE)?.trim()?.take(200).orEmpty().ifBlank { "Nexus Plus" }
            artist = intent.getStringExtra(EXTRA_ARTIST)?.trim()?.take(200).orEmpty().ifBlank { "Media Player" }
            val uri = intent.getStringExtra(EXTRA_URI)
            if (!uri.isNullOrBlank()) {
                playUri(uri, intent.getBooleanExtra(EXTRA_AUTOPLAY, true))
            }
        }
        return START_NOT_STICKY
    }

    private fun playUri(uri: String, autoplay: Boolean) {
        releasePlayer()
        if (!requestAudioFocus()) {
            stopPlayback()
            return
        }

        try {
            player = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .build(),
                )
                setDataSource(uri)
                setOnPreparedListener { if (autoplay) it.start(); updateNotification() }
                setOnCompletionListener { stopPlayback() }
                setOnErrorListener { _, _, _ -> stopPlayback(); true }
                prepareAsync()
            }
            startForeground(NOTIFICATION_ID, buildNotification())
        } catch (_: Throwable) {
            stopPlayback()
        }
    }

    private fun requestAudioFocus(): Boolean {
        val manager = getSystemService(AudioManager::class.java) ?: return false
        val result = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            audioFocusRequest = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(
                    android.media.AudioAttributes.Builder()
                        .setUsage(android.media.AudioAttributes.USAGE_MEDIA)
                        .setContentType(android.media.AudioAttributes.CONTENT_TYPE_MUSIC)
                        .build(),
                )
                .build()
            manager.requestAudioFocus(audioFocusRequest!!)
        } else {
            @Suppress("DEPRECATION")
            manager.requestAudioFocus(null, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN)
        }
        return result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED
    }

    private fun releaseAudioFocus() {
        val manager = getSystemService(AudioManager::class.java)
        if (manager == null) {
            audioFocusRequest = null
            return
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            audioFocusRequest?.let { manager.abandonAudioFocusRequest(it) }
        } else {
            @Suppress("DEPRECATION")
            manager.abandonAudioFocus(null)
        }
        audioFocusRequest = null
    }

    private fun stopPlayback() {
        releasePlayer()
        releaseAudioFocus()
        runCatching { stopForeground(STOP_FOREGROUND_REMOVE) }
        stopSelf()
    }

    private fun releasePlayer() {
        player?.runCatching { stop() }
        player?.release()
        player = null
    }

    private fun buildNotification(): Notification {
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
        val contentIntent = PendingIntent.getActivity(
            this,
            0,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentTitle(title)
            .setContentText(artist)
            .setContentIntent(contentIntent)
            .setOngoing(player?.isPlaying == true)
            .setCategory(NotificationCompat.CATEGORY_TRANSPORT)
            .setOnlyAlertOnce(true)
            .build()
    }

    private fun updateNotification() {
        runCatching {
            getSystemService(NotificationManager::class.java)?.notify(NOTIFICATION_ID, buildNotification())
        }
    }

    private fun createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(CHANNEL_ID, "Media playback", NotificationManager.IMPORTANCE_LOW)
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }

    private fun registerReceiverCompat(receiver: BroadcastReceiver, filter: IntentFilter) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(receiver, filter, RECEIVER_NOT_EXPORTED)
        } else {
            @Suppress("DEPRECATION")
            registerReceiver(receiver, filter)
        }
    }

    override fun onDestroy() {
        runCatching { unregisterReceiver(commandReceiver) }
        releasePlayer()
        releaseAudioFocus()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
