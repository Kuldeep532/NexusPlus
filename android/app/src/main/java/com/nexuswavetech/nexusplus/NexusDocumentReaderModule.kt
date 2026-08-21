package com.nexuswavetech.nexusplus

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.io.Reader
import java.nio.charset.StandardCharsets
import java.util.zip.ZipFile

class NexusDocumentReaderModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    companion object {
        private const val MAX_DOCUMENT_BYTES = 50L * 1024L * 1024L
        private const val MAX_ZIP_ENTRIES = 2000
        private const val MAX_EXTRACTED_TEXT_CHARS = 5_000_000
        private const val MAX_SINGLE_TEXT_CHARS = 2_000_000
    }

    override fun getName(): String = "NexusDocumentReader"

    @ReactMethod
    fun isAvailable(promise: Promise) = promise.resolve(true)

    @ReactMethod
    fun extractText(inputPath: String, format: String, promise: Promise) {
        runCatching {
            val file = File(requireReadablePath(inputPath))
            when (format.lowercase()) {
                "txt", "md" -> readTextBounded(file)
                "html", "rtf" -> stripMarkup(readTextBounded(file), MAX_SINGLE_TEXT_CHARS)
                "epub" -> extractEpubText(file)
                else -> throw IllegalArgumentException("Unsupported text extraction format: $format")
            }
        }.onSuccess { promise.resolve(it) }
            .onFailure { promise.reject("DOCUMENT_TEXT", it.message ?: "Document extraction failed.", null) }
    }

    @ReactMethod
    fun listChapters(inputPath: String, promise: Promise) {
        runCatching {
            val file = File(requireReadablePath(inputPath))
            require(file.extension.equals("epub", ignoreCase = true)) {
                "Chapter listing currently requires an EPUB document."
            }
            val result = Arguments.createArray()
            ZipFile(file).use { zip ->
                require(zip.size() <= MAX_ZIP_ENTRIES) { "EPUB contains too many entries." }
                val container = zip.getEntry("META-INF/container.xml")
                    ?: throw IllegalArgumentException("Invalid EPUB: missing container.xml")
                val containerXml = readReaderBounded(
                    zip.getInputStream(container).bufferedReader(StandardCharsets.UTF_8),
                    MAX_SINGLE_TEXT_CHARS,
                )
                val rootFile = Regex("full-path=\"([^\"]+)\"").find(containerXml)?.groupValues?.get(1)
                    ?: throw IllegalArgumentException("Invalid EPUB: package document not found")
                requireValidZipEntryPath(rootFile)
                val opf = zip.getEntry(rootFile) ?: throw IllegalArgumentException("Invalid EPUB: missing OPF")
                val opfXml = readReaderBounded(
                    zip.getInputStream(opf).bufferedReader(StandardCharsets.UTF_8),
                    MAX_SINGLE_TEXT_CHARS,
                )
                val chapterMatches = Regex("<item[^>]+id=\"([^\"]+)\"[^>]+href=\"([^\"]+)\"[^>]+>")
                    .findAll(opfXml)
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
            .onFailure { promise.reject("DOCUMENT_CHAPTERS", it.message ?: "Chapter listing failed.", null) }
    }

    private fun requireReadablePath(path: String): String {
        require(path.isNotBlank()) { "A document path is required." }
        require(!path.startsWith("content://")) { "Materialize a content URI before native document processing." }
        val file = File(path).canonicalFile
        require(file.exists() && file.isFile && file.canRead()) { "Document is unavailable." }
        require(file.length() <= MAX_DOCUMENT_BYTES) { "Document exceeds the 50 MB processing limit." }
        return file.absolutePath
    }

    private fun readTextBounded(file: File): String =
        file.inputStream().bufferedReader(StandardCharsets.UTF_8).use {
            readReaderBounded(it, MAX_SINGLE_TEXT_CHARS)
        }

    private fun readReaderBounded(reader: Reader, maxChars: Int): String {
        val buffer = CharArray(8192)
        val out = StringBuilder(minOf(maxChars, 64 * 1024))
        var total = 0
        while (true) {
            val count = reader.read(buffer)
            if (count < 0) break
            total += count
            require(total <= maxChars) { "Document text exceeds the processing limit." }
            out.append(buffer, 0, count)
        }
        return out.toString()
    }

    private fun stripMarkup(value: String, maxChars: Int): String {
        val stripped = value
            .replace(Regex("<script[\\s\\S]*?</script>", RegexOption.IGNORE_CASE), "")
            .replace(Regex("<style[\\s\\S]*?</style>", RegexOption.IGNORE_CASE), "")
            .replace(Regex("<[^>]+>"), " ")
            .replace(Regex("\\s+"), " ")
            .trim()
        require(stripped.length <= maxChars) { "Extracted text exceeds the processing limit." }
        return stripped
    }

    private fun extractEpubText(file: File): String {
        val parts = mutableListOf<String>()
        var totalChars = 0
        ZipFile(file).use { zip ->
            require(zip.size() <= MAX_ZIP_ENTRIES) { "EPUB contains too many entries." }
            for (entry in zip.entries()) {
                if (entry.isDirectory) continue
                if (!entry.name.endsWith(".xhtml", true) &&
                    !entry.name.endsWith(".html", true) &&
                    !entry.name.endsWith(".htm", true)
                ) continue

                requireValidZipEntryPath(entry.name)
                val raw = zip.getInputStream(entry).bufferedReader(StandardCharsets.UTF_8).use {
                    readReaderBounded(it, MAX_SINGLE_TEXT_CHARS)
                }
                val text = stripMarkup(raw, MAX_SINGLE_TEXT_CHARS)
                if (text.isNotEmpty()) {
                    totalChars += text.length
                    require(totalChars <= MAX_EXTRACTED_TEXT_CHARS) { "EPUB extracted text exceeds the processing limit." }
                    parts += text
                }
            }
        }
        return parts.joinToString("\n\n")
    }

    private fun requireValidZipEntryPath(path: String) {
        val normalized = path.replace('\\', '/')
        require(!normalized.startsWith("/")) { "Invalid EPUB entry path." }
        require(normalized.split('/').none { it == ".." }) { "Invalid EPUB entry path." }
    }
}
