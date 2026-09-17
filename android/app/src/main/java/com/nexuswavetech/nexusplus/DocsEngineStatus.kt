package com.nexuswavetech.nexusplus

/**
 * Capability boundary for the bundled LibreOffice/LibreOfficeKit document engine.
 *
 * The app must not fake DOCX/PDF conversion when the engine is absent from the
 * Android artifact. This boundary is activated only after the engine binaries
 * and their licensing notices are bundled for the target ABIs.
 */
object DocsEngineStatus {
    const val ENGINE_NAME = "LibreOfficeKit"
    const val REQUIRED_CAPABILITY = "DOCX<->PDF"

    fun unavailableMessage(): String =
        "$ENGINE_NAME is not bundled in this Android build. DOCX/PDF conversion is unavailable."
}
