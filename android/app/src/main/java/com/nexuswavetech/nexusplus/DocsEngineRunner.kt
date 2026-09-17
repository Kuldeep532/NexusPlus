package com.nexuswavetech.nexusplus

import java.io.File
import java.io.IOException
import java.util.concurrent.Executors
import java.util.concurrent.Future

/**
 * Serialized execution boundary for LibreOfficeKit conversions.
 * The actual LOKit/native invocation stays behind DocsEngineStatus so the
 * React Native bridge never performs document conversion on the UI thread.
 */
object DocsEngineRunner {
    private val executor = Executors.newSingleThreadExecutor { runnable ->
        Thread(runnable, "Nexus-Docs-Engine").apply { isDaemon = true }
    }

    fun submit(
        inputPath: String,
        outputPath: String,
        inputExtension: String,
        outputExtension: String,
    ): Future<String> = executor.submit<String> {
        val input = validateDocumentPath(inputPath, "input")
        val output = validateDocumentPath(outputPath, "output")
        require(input.exists() && input.isFile && input.canRead()) { "Input document is unavailable." }
        require(inputExtension.lowercase() == "pdf" || inputExtension.lowercase() == "docx") {
            "Unsupported input document format."
        }
        require(outputExtension.lowercase() == "pdf" || outputExtension.lowercase() == "docx") {
            "Unsupported output document format."
        }
        require(inputExtension.lowercase() != outputExtension.lowercase()) {
            "Document conversion requires different input and output formats."
        }
        require(DocsEngineStatus.isAvailable()) { DocsEngineStatus.unavailableMessage() }

        // Deliberately fail until the real LibreOfficeKit JNI bridge is bundled.
        // This prevents a misleading success path or placeholder document.
        throw IOException("LibreOfficeKit JNI conversion entry point is not bundled in this build.")
    }

    private fun validateDocumentPath(path: String, label: String): File {
        require(path.isNotBlank() && path.length <= 4096) { "Invalid $label document path." }
        require(!path.contains('\u0000') && !path.contains('\r') && !path.contains('\n')) {
            "Invalid $label document path."
        }
        return File(path)
    }
}
