package com.nexuswavetech.nexusplus

import android.net.Uri
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import java.io.BufferedReader
import java.io.File
import java.io.InputStreamReader
import java.nio.charset.StandardCharsets
import java.util.zip.ZipFile
import org.w3c.dom.Document
import javax.xml.parsers.DocumentBuilderFactory

class NexusDocumentReaderModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "NexusDocumentReader"

    @ReactMethod
    fun isAvailable(promise: Promise) = promise.resolve(true)

    @ReactMethod
    fun extractText(inputPath: String, format: String, promise: Promise) {
        runCatching {
            val file = File(requireReadablePath(inputPath))
            when (format.lowercase()) {
                "txt", "md" -> file.readText(StandardCharsets.UTF_8)
                "html", "rtf" -> stripMarkup(file.readText(StandardCharsets.UTF_8))
                "epub" -> extractEpubText(file)
                else -> throw IllegalArgumentException("Unsupported text extraction format: $format")
            }
        }.onSuccess { promise.resolve(it) }
            .onFailure { promise.reject("DOCUMENT_TEXT", it.message, it) }
    }

    @ReactMethod
    fun listChapters(inputPath: String, promise: Promise) {
        runCatching {
            val file = File(requireReadablePath(inputPath))
            require(inputPath.lowercase().endsWith(".epub")) { "Chapter listing currently requires an EPUB document." }
            val result = Arguments.createArray()
            ZipFile(file).use { zip ->
                val container = zip.getEntry("META-INF/container.xml")
                    ?: throw IllegalArgumentException("Invalid EPUB: missing container.xml")
                val containerXml = zip.getInputStream(container).bufferedReader().use { it.readText() }
                val rootFile = Regex("full-path=\"([^\"]+)\"").find(containerXml)?.groupValues?.get(1)
                    ?: throw IllegalArgumentException("Invalid EPUB: package document not found")
                val opf = zip.getEntry(rootFile) ?: throw IllegalArgumentException("Invalid EPUB: missing OPF")
                val opfXml = zip.getInputStream(opf).bufferedReader().use { it.readText() }
                val chapterMatches = Regex("<item[^>]+id=\"([^\"]+)\"[^>]+href=\"([^\"]+)\"[^>]+>").findAll(opfXml)
                for (match in chapterMatches) {
                    val item = Arguments.createMap()
                    item.putString("id", match.groupValues[1])
                    item.putString("title", match.groupValues[1])
                    item.putString("href", match.groupValues[2])
                    result.pushMap(item)
                }
            }
            result
        }.onSuccess { promise.resolve(it) }
            .onFailure { promise.reject("DOCUMENT_CHAPTERS", it.message, it) }
    }

    private fun requireReadablePath(path: String): String {
        require(path.isNotBlank()) { "A document path is required." }
        require(!path.startsWith("content://")) { "Materialize a content URI before native document processing." }
        val file = File(path)
        require(file.exists() && file.canRead()) { "Document is unavailable: $path" }
        return file.absolutePath
    }

    private fun stripMarkup(value: String): String = value
        .replace(Regex("<script[\\s\\S]*?</script>", RegexOption.IGNORE_CASE), "")
        .replace(Regex("<style[\\s\\S]*?</style>", RegexOption.IGNORE_CASE), "")
        .replace(Regex("<[^>]+>"), " ")
        .replace(Regex("\\s+"), " ")
        .trim()

    private fun extractEpubText(file: File): String {
        val parts = mutableListOf<String>()
        ZipFile(file).use { zip ->
            zip.entries().asSequence()
                .filter { !it.isDirectory && (it.name.endsWith(".xhtml", true) || it.name.endsWith(".html", true) || it.name.endsWith(".htm", true)) }
                .forEach { entry ->
                    val raw = zip.getInputStream(entry).bufferedReader(StandardCharsets.UTF_8).use { it.readText() }
                    val text = stripMarkup(raw)
                    if (text.isNotEmpty()) parts += text
                }
        }
        return parts.joinToString("\n\n")
    }
}
