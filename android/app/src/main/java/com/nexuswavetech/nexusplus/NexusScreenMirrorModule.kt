package com.nexuswavetech.nexusplus

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.media.projection.MediaProjectionManager
import android.os.Build
import com.facebook.react.bridge.*

class NexusScreenMirrorModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    companion object { const val REQUEST_CODE = 48271 }
    private var pending: Promise? = null

    override fun getName(): String = "NexusScreenMirror"

    @ReactMethod
    fun getStatus(promise: Promise) {
        promise.resolve(Arguments.createMap().apply {
            putBoolean("available", Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP)
            putBoolean("projectionActive", NexusScreenMirrorService.isProjectionActive)
            putBoolean("mediaActive", NexusScreenMirrorService.isMediaActive)
        })
    }

    @ReactMethod
    fun requestScreenCapture(mode: String, promise: Promise) {
        val activity = reactContext.currentActivity
        if (activity == null) {
            promise.reject("MIRROR_ACTIVITY_UNAVAILABLE", "Nexus Plus must be visible to request screen capture.")
            return
        }
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
            promise.reject("MIRROR_UNSUPPORTED", "Screen projection is unavailable on this Android version.")
            return
        }

        pending?.reject("MIRROR_REQUEST_REPLACED", "A newer capture request replaced this request.")
        pending = promise

        try {
            val manager = activity.getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
            activity.startActivityForResult(manager.createScreenCaptureIntent(), REQUEST_CODE)
        } catch (error: Exception) {
            pending = null
            promise.reject("MIRROR_CONSENT_FAILED", error.message, error)
        }
    }

    @ReactMethod
    fun stopProjection(promise: Promise) {
        NexusScreenMirrorService.stopProjection(reactContext)
        promise.resolve(true)
    }

    @ReactMethod
    fun castMedia(target: String, uri: String, mimeType: String?, kind: String, name: String?, durationMs: Double?, promise: Promise) {
        try {
            NexusScreenMirrorService.castMedia(reactContext, target, uri, mimeType, kind, name, durationMs)
            promise.resolve(true)
        } catch (error: Exception) {
            promise.reject("MEDIA_CAST_FAILED", error.message, error)
        }
    }

    @ReactMethod
    fun replaceCastMedia(uri: String, mimeType: String?, kind: String, name: String?, durationMs: Double?, promise: Promise) {
        try {
            NexusScreenMirrorService.replaceCastMedia(reactContext, uri, mimeType, kind, name, durationMs)
            promise.resolve(true)
        } catch (error: Exception) {
            promise.reject("MEDIA_REPLACE_FAILED", error.message, error)
        }
    }

    @ReactMethod
    fun stopMedia(promise: Promise) {
        NexusScreenMirrorService.stopMedia(reactContext)
        promise.resolve(true)
    }

    fun onScreenCaptureResult(resultCode: Int, data: Intent?) {
        val p = pending ?: return
        pending = null
        if (resultCode != Activity.RESULT_OK || data == null) {
            p.resolve(false)
            return
        }
        try {
            NexusScreenMirrorService.startProjection(reactContext, resultCode, data)
            p.resolve(true)
        } catch (error: Exception) {
            p.reject("MIRROR_START_FAILED", error.message, error)
        }
    }
}
