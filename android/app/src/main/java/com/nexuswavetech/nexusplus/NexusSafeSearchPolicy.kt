package com.nexuswavetech.nexusplus

import android.net.Uri

/** Keyless Google SafeSearch request helper. It does not call Google's API. */
object NexusSafeSearchPolicy {
    private const val GOOGLE_SEARCH_HOST = "www.google.com"
    private const val SAFE_PARAMETER = "safe"
    private const val SAFE_VALUE = "active"

    fun enforce(uri: Uri): Uri {
        if (!isGoogleSearchUri(uri)) return uri
        return uri.buildUpon().appendQueryParameter(SAFE_PARAMETER, SAFE_VALUE).build()
    }

    private fun isGoogleSearchUri(uri: Uri): Boolean =
        uri.scheme == "https" &&
            uri.host?.lowercase() == GOOGLE_SEARCH_HOST &&
            uri.path == "/search"
}
