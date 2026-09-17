package com.nexuswavetech.nexusplus

/**
 * Runtime capability boundary for the bundled LibreOffice/LibreOfficeKit engine.
 *
 * Conversion is enabled only when a real LibreOfficeKit JNI implementation is
 * present in the Android artifact. The app never falls back to placeholder
 * documents, renamed files, or lossy pseudo-conversion.
 */
object DocsEngineStatus {
    const val ENGINE_NAME = "LibreOfficeKit"
    const val REQUIRED_CAPABILITY = "DOCX<->PDF"

    private const val JNI_LIBRARY = "lo-native-code"

    @Volatile
    private var loadAttempted = false

    @Volatile
    private var loaded = false

    @JvmStatic
    fun ensureLoaded(): Boolean {
        if (loaded) return true
        if (loadAttempted) return false
        synchronized(this) {
            if (loaded) return true
            if (loadAttempted) return false
            loadAttempted = true
            loaded = runCatching {
                System.loadLibrary(JNI_LIBRARY)
                true
            }.getOrDefault(false)
            return loaded
        }
    }

    @JvmStatic
    fun isAvailable(): Boolean = ensureLoaded()

    @JvmStatic
    fun unavailableMessage(): String =
        if (loadAttempted && !loaded) {
            "$ENGINE_NAME native engine is not available for this Android ABI. DOCX/PDF conversion is unavailable."
        } else {
            "$ENGINE_NAME is not bundled in this Android build. DOCX/PDF conversion is unavailable."
        }
}
