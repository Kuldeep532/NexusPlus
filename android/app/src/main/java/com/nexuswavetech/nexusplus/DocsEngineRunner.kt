package com.nexuswavetech.nexusplus

import java.io.File
import java.io.IOException
import java.util.concurrent.Executors
import java.util.concurrent.Future
import java.util.concurrent.TimeUnit

/** Serialized conversion execution boundary for the native document engine. */
object DocsEngineRunner {
    private const val MAX_INPUT_BYTES = 50L * 1024L * 1024L
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
        require(input.length() in 1..MAX_INPUT_BYTES) { "Input document exceeds the supported 50 MB limit." }
        require(inputExtension.lowercase() == "pdf" || inputExtension.lowercase() == "docx") { "Unsupported input document format." }
        require(outputExtension.lowercase() == "pdf" || outputExtension.lowercase() == "docx") { "Unsupported output document format." }
        require(inputExtension.lowercase() != outputExtension.lowercase()) { "Document conversion requires different input and output formats." }
        require(DocsEngineStatus.isAvailable()) { DocsEngineStatus.unavailableMessage() }
        DocsEngineAdapter.convert(input.absolutePath, output.absolutePath)
    }

    fun await(future: Future<String>): String =
        try {
            future.get(5, TimeUnit.MINUTES)
        } catch (error: Throwable) {
            future.cancel(true)
            throw if (error is IOException) error else IOException(error.message ?: "Document conversion failed.", error)
        }

    private fun validateDocumentPath(path: String, label: String): File {
        require(path.isNotBlank() && path.length <= 4096) { "Invalid $label document path." }
        require(!path.contains('\u0000') && !path.contains('\r') && !path.contains('\n')) { "Invalid $label document path." }
        return File(path)
    }
}
