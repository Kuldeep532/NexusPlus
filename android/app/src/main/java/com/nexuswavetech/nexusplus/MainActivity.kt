package com.nexuswavetech.nexusplus

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity

/**
 * Native launch shell. The React Native/Expo app owns the visual UI; this
 * activity only preserves Android intent handoff for media launches.
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
        if (intent?.action != Intent.ACTION_VIEW) return
        val uri: Uri = intent.data ?: return
        val scheme = uri.scheme?.lowercase() ?: return
        if (scheme !in setOf("content", "file", "http", "https")) return

        val mime = intent.type ?: contentResolver.getType(uri) ?: return
        if (!NexusMediaIntent.isSupportedMediaType(mime)) return
        if (uri.toString().contains('\u0000')) return

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
