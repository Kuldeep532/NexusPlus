package com.nexuswavetech.nexusplus

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity

/**
 * Native launch shell. The React Native/Expo app owns the visual UI; this
 * activity only preserves Android intent handoff for media/document "Open with"
 * launches and provides a stable native entry point.
 */
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        publishIncomingIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        publishIncomingIntent(intent)
    }

    private fun publishIncomingIntent(intent: Intent?) {
        val uri: Uri = intent?.data ?: return
        if (intent.action != Intent.ACTION_VIEW) return
        val mime = intent.type ?: contentResolver.getType(uri) ?: return
        if (!NexusMediaIntent.isSupportedMediaType(mime)) return

        // The RN/Expo layer can consume this URI through the app-launch handoff
        // contract without exposing filesystem paths to JavaScript.
        MediaLaunchStore.setPendingMedia(uri.toString(), mime)
    }
}

object MediaLaunchStore {
    @Volatile private var pendingUri: String? = null
    @Volatile private var pendingMime: String? = null

    @Synchronized
    fun setPendingMedia(uri: String, mime: String) {
        pendingUri = uri
        pendingMime = mime
    }

    @Synchronized
    fun consume(): Pair<String, String>? {
        val uri = pendingUri ?: return null
        val mime = pendingMime ?: return null
        pendingUri = null
        pendingMime = null
        return uri to mime
    }
}
