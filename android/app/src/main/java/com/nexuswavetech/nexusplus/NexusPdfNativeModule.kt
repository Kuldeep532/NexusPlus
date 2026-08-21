package com.nexuswavetech.nexusplus

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Android PDF bridge boundary.
 * The heavy PDF implementation stays behind this module so React Native UI
 * and future iOS implementation keep the same TypeScript contract.
 */
class NexusPdfNativeModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "NexusPdfNative"

    @ReactMethod
    fun isAvailable(promise: Promise) {
        promise.resolve(true)
    }

    @ReactMethod
    fun merge(inputPaths: com.facebook.react.bridge.ReadableArray, outputPath: String, promise: Promise) {
        promise.reject("PDF_BACKEND", "Android PDF backend operation is not wired yet.")
    }

    @ReactMethod
    fun imageToPdf(inputPaths: com.facebook.react.bridge.ReadableArray, outputPath: String, quality: Int, promise: Promise) {
        promise.reject("PDF_BACKEND", "Android PDF backend operation is not wired yet.")
    }

    @ReactMethod
    fun protect(inputPath: String, outputPath: String, password: String, promise: Promise) {
        promise.reject("PDF_BACKEND", "Android PDF backend operation is not wired yet.")
    }

    @ReactMethod
    fun unlock(inputPath: String, outputPath: String, password: String, promise: Promise) {
        promise.reject("PDF_BACKEND", "Android PDF backend operation is not wired yet.")
    }

    @ReactMethod
    fun compress(inputPath: String, outputPath: String, quality: Int, promise: Promise) {
        promise.reject("PDF_BACKEND", "Android PDF backend operation is not wired yet.")
    }
}
