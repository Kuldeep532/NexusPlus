package com.nexuswavetech.nexusplus

import android.content.Intent
import android.net.Uri

/** Central MIME mapping for Android "Open with Nexus Media Player" support. */
object NexusMediaIntent {
    const val ACTION_VIEW = Intent.ACTION_VIEW

    fun isSupportedMediaType(type: String?): Boolean {
        if (type.isNullOrBlank()) return false
        return type.startsWith("audio/") || type.startsWith("video/")
    }

    fun buildViewIntent(uri: Uri, mimeType: String): Intent =
        Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, mimeType)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
        }
}
