package com.nexuswavetech.nexusplus

import android.content.Intent
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
        startService(uri, title, artist, true)
        promise.resolve(true)
    }

    @ReactMethod
    fun pause(promise: Promise) {
        reactContext.sendBroadcast(Intent(NexusMediaPlaybackService.ACTION_PAUSE))
        promise.resolve(true)
    }

    @ReactMethod
    fun resume(promise: Promise) {
        reactContext.sendBroadcast(Intent(NexusMediaPlaybackService.ACTION_RESUME))
        promise.resolve(true)
    }

    @ReactMethod
    fun stop(promise: Promise) {
        reactContext.sendBroadcast(Intent(NexusMediaPlaybackService.ACTION_STOP))
        promise.resolve(true)
    }

    @ReactMethod
    fun seekTo(positionMs: Double, promise: Promise) {
        reactContext.sendBroadcast(
            Intent(NexusMediaPlaybackService.ACTION_SEEK).putExtra(NexusMediaPlaybackService.EXTRA_POSITION_MS, positionMs.toLong()),
        )
        promise.resolve(true)
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
