package com.nexuswavetech.nexusplus

import android.net.Uri
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.io.FileOutputStream

/** Materializes a SAF/content URI into app-private cache for native document processing. */
class NexusFileUriModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    companion object {
        private const val MAX_MATERIALIZED_BYTES = 50L * 1024L * 1024L
    }

    override fun getName(): String = "NexusFileUri"

    @ReactMethod
    fun materialize(uriString: String, promise: Promise) {
        var target: File? = null
        try {
            val uri = Uri.parse(uriString)
            if (uri.scheme != "content") {
                promise.resolve(uriString)
                return
            }

            val resolver = reactContext.contentResolver
            val name = "nexus-${System.currentTimeMillis()}-${(uri.path ?: "file").hashCode()}.bin"
            target = File(reactContext.cacheDir, name)

            resolver.openInputStream(uri).use { input ->
                requireNotNull(input) { "Unable to open selected document." }
                FileOutputStream(target).use { output ->
                    val buffer = ByteArray(DEFAULT_BUFFER_SIZE)
                    var total = 0L
                    while (true) {
                        val count = input.read(buffer)
                        if (count < 0) break
                        total += count
                        require(total <= MAX_MATERIALIZED_BYTES) {
                            "Selected document exceeds the 50 MB processing limit."
                        }
                        output.write(buffer, 0, count)
                    }
                    output.fd.sync()
                }
            }
            promise.resolve(target.absolutePath)
        } catch (error: Throwable) {
            target?.delete()
            promise.reject("FILE_MATERIALIZE", error.message ?: "Unable to materialize selected document.", null)
        }
    }
}
