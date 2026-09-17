package com.nexuswavetech.nexusplus

import java.io.File

/**
 * Android-side adapter for the bundled LibreOfficeKit engine.
 *
 * The native payload is liblo-native-code.so. Conversion calls are exposed
 * through a small JNI bridge so the React Native layer never fabricates files.
 */
object LibreOfficeEngine {
    private const val NATIVE_LIBRARY = "lo-native-code"
    @Volatile private var loaded = false

    fun isBundled(): Boolean = runCatching { ensureLoaded(); true }.getOrDefault(false)

    @Synchronized
    private fun ensureLoaded() {
        if (loaded) return
        System.loadLibrary(NATIVE_LIBRARY)
        loaded = true
    }

    fun requireBundled() {
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
        require(path.isNotBlank() && path.length <= 4096) { "Document input path is invalid." }
        require(!path.contains('\u0000') && !path.contains('\r') && !path.contains('\n')) { "Document input path is invalid." }
        val file = File(path)
        require(file.isFile && file.canRead()) { "Document input is not readable." }
        return file
    }

    fun requireWritableTarget(path: String): File {
        require(path.isNotBlank() && path.length <= 4096) { "Document output path is invalid." }
        require(!path.contains('\u0000') && !path.contains('\r') && !path.contains('\n')) { "Document output path is invalid." }
        val file = File(path)
        file.parentFile?.mkdirs()
        require(file.parentFile?.isDirectory == true && file.parentFile?.canWrite() == true) {
            "Document output directory is unavailable."
        }
        return file
    }

    fun convert(input: File, output: File, inputExtension: String, outputExtension: String) {
        requireBundled()
        nativeConvert(input.absolutePath, output.absolutePath, inputExtension, outputExtension)
    }

    @JvmStatic
    private external fun nativeConvert(
        inputPath: String,
        outputPath: String,
        inputExtension: String,
        outputExtension: String,
    )
}
