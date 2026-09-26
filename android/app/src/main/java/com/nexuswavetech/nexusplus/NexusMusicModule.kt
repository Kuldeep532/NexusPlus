package com.nexuswavetech.nexusplus

import android.app.SearchManager
import android.content.Intent
import android.media.AudioManager
import android.provider.MediaStore
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class NexusMusicModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "NexusMusic"

    @ReactMethod
    fun listMusicApps(promise: Promise) {
        try {
            val pm = reactContext.packageManager
            val intent = Intent(Intent.ACTION_MAIN).apply {
                addCategory(Intent.CATEGORY_APP_MUSIC)
            }
            val resolved = pm.queryIntentActivities(intent, 0)
                .distinctBy { it.activityInfo.packageName }
                .map {
                    Arguments.createMap().apply {
                        putString("packageName", it.activityInfo.packageName)
                        putString("label", it.loadLabel(pm).toString())
                    }
                }
            promise.resolve(Arguments.fromList(resolved))
        } catch (error: Throwable) {
            promise.reject("MUSIC_APPS", error.message ?: "Unable to list music apps.", null)
        }
    }

    @ReactMethod
    fun playFromSearch(query: String, packageName: String?, promise: Promise) {
        try {
            val trimmed = query.trim()
            require(trimmed.isNotEmpty()) { "Song name is required." }

            val base = Intent(MediaStore.INTENT_ACTION_MEDIA_PLAY_FROM_SEARCH).apply {
                addCategory(Intent.CATEGORY_DEFAULT)
                putExtra(MediaStore.EXTRA_MEDIA_FOCUS, MediaStore.Audio.Media.ENTRY_CONTENT_TYPE)
                putExtra(SearchManager.QUERY, trimmed)
                putExtra(MediaStore.EXTRA_MEDIA_TITLE, trimmed)
            }

            val launchIntent = if (!packageName.isNullOrBlank()) Intent(base).setPackage(packageName) else base
            if (launchIntent.resolveActivity(reactContext.packageManager) == null) {
                promise.resolve(false)
                return
            }

            reactContext.startActivity(launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
            promise.resolve(true)
        } catch (error: Throwable) {
            promise.reject("MUSIC_PLAY", error.message ?: "Unable to send music search intent.", null)
        }
    }

    @ReactMethod
    fun sendMediaKey(action: String, promise: Promise) {
        val keyCode = when (action.trim().lowercase()) {
            "play", "resume" -> android.view.KeyEvent.KEYCODE_MEDIA_PLAY
            "pause" -> android.view.KeyEvent.KEYCODE_MEDIA_PAUSE
            "next" -> android.view.KeyEvent.KEYCODE_MEDIA_NEXT
            "previous" -> android.view.KeyEvent.KEYCODE_MEDIA_PREVIOUS
            "stop" -> android.view.KeyEvent.KEYCODE_MEDIA_STOP
            else -> {
                promise.reject("MUSIC_KEY", "Unsupported music action.", null)
                return
            }
        }

        val manager = reactContext.getSystemService(AudioManager::class.java)
        if (manager == null) {
            promise.resolve(false)
            return
        }

        runCatching {
            manager.dispatchMediaKeyEvent(android.view.KeyEvent(android.view.KeyEvent.ACTION_DOWN, keyCode))
            manager.dispatchMediaKeyEvent(android.view.KeyEvent(android.view.KeyEvent.ACTION_UP, keyCode))
            promise.resolve(true)
        }.onFailure { promise.resolve(false) }
    }
}
