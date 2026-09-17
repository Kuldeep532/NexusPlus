package com.nexuswavetech.nexusplus

import java.io.File

/**
 * Android-side adapter boundary for the bundled LibreOfficeKit engine.
 *
 * The real LibreOffice mobile engine is native code (liblo-native-code.so)
 * and is intentionally loaded only when its ABI-specific payload is present.
 * This class does not fabricate conversion output when that payload is absent.
 */
object LibreOfficeEngine {
    private const val NATIVE_LIBRARY = "lo-native-code"
    @Volatile private var loaded = false

    fun isBundled(): Boolean {
        return try {
            ensureLoaded()
            true
        } catch (_: Throwable) {
            false
        }
    }

    @Synchronized
    private fun ensureLoaded() {
        if (loaded) return
        System.loadLibrary(NATIVE_LIBRARY)
        loaded = true
    }

    fun requireBundled(): Unit {
        try {
            ensureLoaded()
        } catch (error: Throwable) {
            throw IllegalStateException(
                "LibreOfficeKit native engine is not bundled for this Android ABI.",
                error,
            )
        }
    }

    fun requireReadableFile(path: String): File {
        require(path.isNotBlank()) { "Document path is required." }
        val file = File(path)
        require(file.isFile && file.canRead()) { "Document input is not readable." }
        return file
    }

    fun requireWritableTarget(path: String): File {
        require(path.isNotBlank()) { "Document output path is required." }
        val file = File(path)
        file.parentFile?.mkdirs()
        require(file.parentFile?.isDirectory == true && file.parentFile?.canWrite() == true) {
            "Document output directory is unavailable."
        }
        return file
    }
}
