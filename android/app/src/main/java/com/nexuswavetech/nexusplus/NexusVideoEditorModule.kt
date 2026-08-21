package com.nexuswavetech.nexusplus

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap

class NexusVideoEditorModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "NexusVideoEditor"

    @ReactMethod
    fun isAvailable(promise: Promise) {
        promise.resolve(false)
    }

    @ReactMethod
    fun execute(operation: ReadableMap, promise: Promise) {
        promise.reject("VIDEO_NATIVE", "Native video engine registration is pending in the Android build.")
    }
}
