package com.nexuswavetech.nexusplus

import android.net.Uri
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.io.FileOutputStream

/** Materializes a SAF/content URI into app-private cache for native PDF processing. */
class NexusFileUriModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "NexusFileUri"

    @ReactMethod
    fun materialize(uriString: String, promise: Promise) {
        try {
            val uri = Uri.parse(uriString)
            if (uri.scheme != "content") {
                promise.resolve(uriString)
                return
            }

            val resolver = reactContext.contentResolver
            val name = "nexus-${System.currentTimeMillis()}-${(uri.path ?: "file").hashCode()}.bin"
            val target = File(reactContext.cacheDir, name)
            resolver.openInputStream(uri).use { input ->
                requireNotNull(input) { "Unable to open selected document." }
                FileOutputStream(target).use { output -> input.copyTo(output) }
            }
            promise.resolve(target.absolutePath)
        } catch (error: Throwable) {
            promise.reject("FILE_MATERIALIZE", error.message, error)
        }
    }
}
