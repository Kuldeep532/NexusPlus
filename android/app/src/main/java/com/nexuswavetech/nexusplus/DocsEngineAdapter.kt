package com.nexuswavetech.nexusplus

import java.io.File
import java.io.IOException

/**
 * Vendor-neutral document conversion adapter.
 *
 * LibreOfficeKit is the selected native engine. The adapter owns only the
 * engine-facing invocation; validation, threading and React Promise handling
 * remain outside this class.
 */
object DocsEngineAdapter {
    fun isAvailable(): Boolean = DocsEngineStatus.isAvailable()

    fun convert(inputPath: String, outputPath: String): String {
        val input = requireReadable(inputPath)
        val output = requireWritable(outputPath)
        val inputExt = extensionOf(input)
        val outputExt = extensionOf(output)
        require(inputExt == "pdf" || inputExt == "docx") { "Unsupported input document format." }
        require(outputExt == "pdf" || outputExt == "docx") { "Unsupported output document format." }
        require(inputExt != outputExt) { "Document conversion requires different input and output formats." }
        require(DocsEngineStatus.isAvailable()) { DocsEngineStatus.unavailableMessage() }

        return try {
            LibreOfficeEngine.convert(input.absolutePath, output.absolutePath, inputExt, outputExt)
            require(output.isFile && output.length() > 0L) { "Document engine did not produce a valid output file." }
            output.absolutePath
        } catch (error: Throwable) {
            runCatching { if (output.exists()) output.delete() }
            throw IOException("Document conversion failed: ${error.message ?: "native engine error"}", error)
        }
    }

    private fun requireReadable(path: String): File = LibreOfficeEngine.requireReadableFile(path)

    private fun requireWritable(path: String): File = LibreOfficeEngine.requireWritableTarget(path)

    private fun extensionOf(file: File): String = file.extension.lowercase()
}
