package com.nexuswavetech.nexusplus

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        setTheme(R.style.Theme_NexusPlus)
        super.onCreate(null)
        publishIncomingIntent(intent)
    }

    override fun getMainComponentName(): String = "main"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        ReactActivityDelegateWrapper(
            this,
            BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
            object : DefaultReactActivityDelegate(
                this,
                mainComponentName,
                fabricEnabled,
            ) {},
        )

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        publishIncomingIntent(intent)
    }

    override fun invokeDefaultOnBackPressed() {
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
            if (!moveTaskToBack(false)) super.invokeDefaultOnBackPressed()
            return
        }
        super.invokeDefaultOnBackPressed()
    }

    private fun publishIncomingIntent(intent: Intent?) {
        if (intent?.action != Intent.ACTION_VIEW) return
        val uri: Uri = intent.data ?: return
        val scheme = uri.scheme?.lowercase() ?: return

        // Auth callbacks are consumed by the JS auth flow. Do not treat them as media.
        if (scheme == "nexus-plus" && uri.host == "auth") return

        // Only accept provider-backed or HTTPS media URIs. Never ingest file:// paths.
        if (scheme != "content" && scheme != "https") return

        val mime = intent.type ?: contentResolver.getType(uri) ?: return
        if (!isSupportedMediaType(mime)) return
        if (uri.toString().contains('\u0000')) return

        MediaLaunchStore.setPendingMedia(uri.toString(), mime)
    }

    private fun isSupportedMediaType(mime: String): Boolean {
        val normalized = mime.trim().lowercase()
        return normalized.startsWith("audio/") || normalized.startsWith("video/")
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
