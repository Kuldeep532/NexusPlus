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
    fun isAvailable(promise: Promise) { promise.resolve(Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) }

    @ReactMethod
    fun play(uri: String, title: String, artist: String?, promise: Promise) {
        try {
            requireValidMediaUri(uri)
            startOrUpdateService(title, artist, true)
            promise.resolve(true)
        } catch (error: IllegalArgumentException) {
            promise.reject("MEDIA_INPUT", error.message, null)
        } catch (error: Throwable) {
            promise.reject("MEDIA_PLAY", error.message ?: "Unable to start media notification.", null)
        }
    }

    @ReactMethod
    fun pause(promise: Promise) { sendCommand(NexusMediaPlaybackService.ACTION_PAUSE); promise.resolve(true) }

    @ReactMethod
    fun resume(promise: Promise) { sendCommand(NexusMediaPlaybackService.ACTION_RESUME); promise.resolve(true) }

    @ReactMethod
    fun stop(promise: Promise) { sendCommand(NexusMediaPlaybackService.ACTION_STOP); promise.resolve(true) }

    @ReactMethod
    fun update(title: String, artist: String?, playing: Boolean, promise: Promise) {
        startOrUpdateService(title, artist, playing)
        promise.resolve(true)
    }

    @ReactMethod
    fun sendSystemMediaKey(key: String, promise: Promise) {
        val keyCode = when (key.trim().lowercase()) {
            "play", "resume", "play-pause" -> android.view.KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE
            "pause" -> android.view.KeyEvent.KEYCODE_MEDIA_PAUSE
            "previous" -> android.view.KeyEvent.KEYCODE_MEDIA_PREVIOUS
            "next" -> android.view.KeyEvent.KEYCODE_MEDIA_NEXT
            "stop" -> android.view.KeyEvent.KEYCODE_MEDIA_STOP
            else -> null
        }
        if (keyCode == null) { promise.reject("MEDIA_KEY", "Unsupported media key.", null); return }
        val manager = reactContext.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
        if (manager == null) { promise.resolve(false); return }
        runCatching {
            manager.dispatchMediaKeyEvent(android.view.KeyEvent(android.view.KeyEvent.ACTION_DOWN, keyCode))
            manager.dispatchMediaKeyEvent(android.view.KeyEvent(android.view.KeyEvent.ACTION_UP, keyCode))
            promise.resolve(true)
        }.onFailure { promise.resolve(false) }
    }

    private fun sendCommand(action: String) {
        reactContext.sendBroadcast(Intent(action).setPackage(reactContext.packageName))
    }

    private fun startOrUpdateService(title: String, artist: String?, playing: Boolean) {
        val intent = Intent(reactContext, NexusMediaPlaybackService::class.java).apply {
            action = NexusMediaPlaybackService.ACTION_UPDATE
            putExtra(NexusMediaPlaybackService.EXTRA_TITLE, title.trim().take(200).ifBlank { "Nexus Plus" })
            putExtra(NexusMediaPlaybackService.EXTRA_ARTIST, artist?.trim()?.take(200).orEmpty().ifBlank { "Media Player" })
            putExtra(NexusMediaPlaybackService.EXTRA_PLAYING, playing)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) reactContext.startForegroundService(intent)
        else reactContext.startService(intent)
    }

    private fun requireValidMediaUri(uriString: String) {
        val uri = Uri.parse(uriString)
        require(uri.scheme in setOf("https", "http", "content", "file")) { "Unsupported media URI scheme." }
        require(!uriString.contains('\u0000')) { "Invalid media URI." }
    }
}
