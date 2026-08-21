package com.nexuswavetech.nexusplus

import android.content.Intent
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
        } catch (error: Throwable) {
            promise.reject("MEDIA_PLAY", "Unable to start media playback.", null)
        }
    }

    @ReactMethod
    fun pause(promise: Promise) {
        reactContext.sendBroadcast(Intent(NexusMediaPlaybackService.ACTION_PAUSE).setPackage(reactContext.packageName))
        promise.resolve(true)
    }

    @ReactMethod
    fun resume(promise: Promise) {
        reactContext.sendBroadcast(Intent(NexusMediaPlaybackService.ACTION_RESUME).setPackage(reactContext.packageName))
        promise.resolve(true)
    }

    @ReactMethod
    fun stop(promise: Promise) {
        reactContext.sendBroadcast(Intent(NexusMediaPlaybackService.ACTION_STOP).setPackage(reactContext.packageName))
        promise.resolve(true)
    }

    @ReactMethod
    fun seekTo(positionMs: Double, promise: Promise) {
        if (!positionMs.isFinite() || positionMs < 0.0) {
            promise.reject("MEDIA_POSITION", "Playback position must be a non-negative finite value.", null)
            return
        }
        val bounded = positionMs.coerceAtMost(Int.MAX_VALUE.toDouble()).toLong()
        reactContext.sendBroadcast(
            Intent(NexusMediaPlaybackService.ACTION_SEEK)
                .setPackage(reactContext.packageName)
                .putExtra(NexusMediaPlaybackService.EXTRA_POSITION_MS, bounded),
        )
        promise.resolve(true)
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
}
