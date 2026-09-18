package com.nexuswavetech.nexusplus

import android.net.Uri
import com.facebook.react.bridge.*
import com.google.android.gms.cast.CastDevice
import com.google.android.gms.cast.CastSession
import com.google.android.gms.cast.MediaInfo
import com.google.android.gms.cast.MediaLoadRequestData
import com.google.android.gms.cast.MediaMetadata
import com.google.android.gms.cast.framework.CastContext
import com.google.android.gms.cast.framework.CastSession

class NexusTvCastModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "NexusTvCast"

    @ReactMethod
    fun isAvailable(promise: Promise) {
        try {
            CastContext.getSharedInstance(reactContext.applicationContext)
            promise.resolve(true)
        } catch (error: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun getSessionDevice(promise: Promise) {
        try {
            val session = currentSession()
            promise.resolve(deviceMap(session?.castDevice, session))
        } catch (error: Exception) {
            promise.reject("TV_SESSION_FAILED", error.message, error)
        }
    }

    @ReactMethod
    fun loadMedia(url: String, mimeType: String?, title: String?, kind: String, durationMs: Double?, promise: Promise) {
        try {
            val loaded = loadMediaOnCurrentSession(reactContext.applicationContext, url, mimeType, title, kind, durationMs)
            promise.resolve(loaded)
        } catch (error: Exception) {
            promise.reject("TV_MEDIA_LOAD_FAILED", error.message, error)
        }
    }

    @ReactMethod
    fun stopMedia(promise: Promise) {
        try {
            val session = currentSession()
            val remote = session?.remoteMediaClient
            if (remote == null) {
                promise.resolve(false)
                return
            }
            remote.stop()
            promise.resolve(true)
        } catch (error: Exception) {
            promise.reject("TV_MEDIA_STOP_FAILED", error.message, error)
        }
    }

    private fun currentSession(): CastSession? =
        CastContext.getSharedInstance(reactContext.applicationContext).sessionManager.currentCastSession

    private fun deviceMap(device: CastDevice?, session: CastSession?): WritableMap {
        return Arguments.createMap().apply {
            putBoolean("connected", session != null && session.isConnected)
            if (device != null) {
                putString("id", device.deviceId)
                putString("name", device.friendlyName)
                putString("model", device.modelName)
                putString("ipAddress", device.inetAddress?.hostAddress)
                putString("deviceVersion", device.deviceVersion)
            }
        }
    }

    companion object {
        fun loadMediaOnCurrentSession(
            context: android.content.Context,
            url: String,
            mimeType: String?,
            title: String?,
            kind: String,
            durationMs: Double?
        ): Boolean {
            val session = CastContext.getSharedInstance(context).sessionManager.currentCastSession
                ?: throw IllegalStateException("No compatible TV Cast session is connected.")
            val remote = session.remoteMediaClient
                ?: throw IllegalStateException("The TV Cast session does not expose media playback.")
            val metadataType = if (kind.equals("image", ignoreCase = true)) {
                MediaMetadata.MEDIA_TYPE_PHOTO
            } else {
                MediaMetadata.MEDIA_TYPE_MOVIE
            }
            val metadata = MediaMetadata(metadataType).apply {
                putString(MediaMetadata.KEY_TITLE, title ?: "Nexus Plus Cast")
            }
            val mediaInfoBuilder = MediaInfo.Builder(url)
                .setStreamType(MediaInfo.STREAM_TYPE_BUFFERED)
                .setContentType(mimeType ?: if (kind.equals("image", ignoreCase = true)) "image/jpeg" else "video/mp4")
                .setMetadata(metadata)
            if ((durationMs ?: 0.0) > 0.0) {
                mediaInfoBuilder.setStreamDuration(durationMs!!.toLong())
            }
            val request = MediaLoadRequestData.Builder()
                .setMediaInfo(mediaInfoBuilder.build())
                .build()
            remote.load(request)
            return true
        }
    }
}
