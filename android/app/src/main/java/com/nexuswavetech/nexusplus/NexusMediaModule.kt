package com.nexuswavetech.nexusplus

import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class NexusMediaModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "NexusMedia"

    @ReactMethod
    fun isAvailable(promise: Promise) {
        promise.resolve(Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
    }

    @ReactMethod
    fun play(uri: String, title: String, artist: String?, promise: Promise) {
        try {
            requireValidMediaUri(uri)
            val safeTitle = title.trim().ifBlank { "Nexus Plus" }.take(200)
            val safeArtist = artist?.trim()?.take(200)
            startService(uri, safeTitle, safeArtist, true)
            promise.resolve(true)
        } catch (error: IllegalArgumentException) {
            promise.reject("MEDIA_INPUT", error.message, null)
        } catch (_: Throwable) {
            promise.reject("MEDIA_PLAY", "Unable to start media playback.", null)
        }
    }

    @ReactMethod
    fun pause(promise: Promise) {
        send(ACTION_PAUSE)
        promise.resolve(true)
    }

    @ReactMethod
    fun resume(promise: Promise) {
        send(ACTION_RESUME)
        promise.resolve(true)
    }

    @ReactMethod
    fun stop(promise: Promise) {
        send(ACTION_STOP)
        promise.resolve(true)
    }

    @ReactMethod
    fun seekRelative(deltaMs: Double, promise: Promise) {
        if (!deltaMs.isFinite() || deltaMs == 0.0) {
            promise.reject("MEDIA_DELTA", "Seek delta must be a non-zero finite value.", null)
            return
        }
        val delta = deltaMs.coerceIn(-60_000.0, 60_000.0).toLong()
        send(ACTION_SEEK_RELATIVE, delta)
        promise.resolve(true)
    }

    @ReactMethod
    fun sendSystemMediaKey(key: String, promise: Promise) {
        val normalized = key.trim().lowercase()
        val keyCode = when (normalized) {
            "play", "resume", "play-pause" -> android.view.KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE
            "pause" -> android.view.KeyEvent.KEYCODE_MEDIA_PAUSE
            "next" -> android.view.KeyEvent.KEYCODE_MEDIA_NEXT
            "previous" -> android.view.KeyEvent.KEYCODE_MEDIA_PREVIOUS
            "stop" -> android.view.KeyEvent.KEYCODE_MEDIA_STOP
            else -> null
        }
        if (keyCode == null) {
            promise.reject("MEDIA_KEY", "Unsupported media key.", null)
            return
        }
        val manager = reactContext.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
        if (manager == null) {
            promise.resolve(false)
            return
        }
        try {
            manager.dispatchMediaKeyEvent(android.view.KeyEvent(android.view.KeyEvent.ACTION_DOWN, keyCode))
            manager.dispatchMediaKeyEvent(android.view.KeyEvent(android.view.KeyEvent.ACTION_UP, keyCode))
            promise.resolve(true)
        } catch (_: Throwable) {
            promise.resolve(false)
        }
    }

    private fun send(action: String, positionMs: Long? = null) {
        reactContext.sendBroadcast(
            Intent(action).setPackage(reactContext.packageName).apply {
                if (positionMs != null) putExtra(NexusMediaPlaybackService.EXTRA_POSITION_MS, positionMs)
            },
        )
    }

    private fun requireValidMediaUri(uriString: String) {
        val uri = Uri.parse(uriString)
        require(uri.scheme in setOf("https", "http", "content", "file")) { "Unsupported media URI scheme." }
        require(!uriString.contains('\u0000')) { "Invalid media URI." }
    }

    private fun startService(uri: String, title: String, artist: String?, play: Boolean) {
        val intent = Intent(reactContext, NexusMediaPlaybackService::class.java).apply {
            action = NexusMediaPlaybackService.ACTION_PLAY
            putExtra(NexusMediaPlaybackService.EXTRA_URI, uri)
            putExtra(NexusMediaPlaybackService.EXTRA_TITLE, title)
            putExtra(NexusMediaPlaybackService.EXTRA_ARTIST, artist)
            putExtra(NexusMediaPlaybackService.EXTRA_AUTOPLAY, play)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) reactContext.startForegroundService(intent)
        else reactContext.startService(intent)
    }

    companion object {
        private const val ACTION_PAUSE = NexusMediaPlaybackService.ACTION_PAUSE
        private const val ACTION_RESUME = NexusMediaPlaybackService.ACTION_RESUME
        private const val ACTION_STOP = NexusMediaPlaybackService.ACTION_STOP
        private const val ACTION_SEEK_RELATIVE = "com.nexuswavetech.nexusplus.media.SEEK_RELATIVE"
    }
}
