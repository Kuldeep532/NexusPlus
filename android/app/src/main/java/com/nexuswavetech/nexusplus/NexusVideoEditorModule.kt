package com.nexuswavetech.nexusplus

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap

class NexusVideoEditorModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "NexusVideoEditor"

    @ReactMethod
    fun isAvailable(promise: Promise) {
        promise.resolve(true)
    }

    @ReactMethod
    fun execute(operation: ReadableMap, promise: Promise) {
        try {
            val type = operation.getString("type") ?: throw IllegalArgumentException("Video operation type is required.")
            when (type) {
                "remove-segment" -> {
                    val inputUri = operation.getString("inputUri") ?: throw IllegalArgumentException("Input video URI is required.")
                    val outputUri = operation.getString("outputUri") ?: throw IllegalArgumentException("Output video URI is required.")
                    val startMs = operation.getDouble("startMs")
                    val endMs = operation.getDouble("endMs")
                    val result = NexusVideoCutter.removeSegment(reactContext, inputUri, outputUri, startMs, endMs)
                    promise.resolve(Arguments.makeNativeMap(result))
                }
                "audio-to-video" -> {
                    val audioUri = operation.getString("audioUri") ?: throw IllegalArgumentException("Audio URI is required.")
                    val outputUri = operation.getString("outputUri") ?: throw IllegalArgumentException("Output video URI is required.")
                    val rawImages = operation.getArray("images") ?: throw IllegalArgumentException("At least one image is required.")
                    require(rawImages.size() > 0) { "At least one image is required." }
                    val images = buildList {
                        for (index in 0 until rawImages.size()) {
                            val item = rawImages.getMap(index) ?: throw IllegalArgumentException("Image ${index + 1} is invalid.")
                            val uri = item.getString("uri") ?: throw IllegalArgumentException("Image ${index + 1} URI is required.")
                            val durationMs = item.getDouble("durationMs")
                            add(NexusAudioToVideoRenderer.ImageSpec(uri, durationMs))
                        }
                    }
                    val result = NexusAudioToVideoRenderer.render(reactContext, audioUri, images, outputUri)
                    promise.resolve(Arguments.makeNativeMap(result))
                }
                else -> promise.reject("VIDEO_OPERATION_UNSUPPORTED", "Video operation '$type' is not implemented yet.")
            }
        } catch (error: Throwable) {
            promise.reject("VIDEO_NATIVE", error.message ?: "Native video operation failed.", error)
        }
    }
}
