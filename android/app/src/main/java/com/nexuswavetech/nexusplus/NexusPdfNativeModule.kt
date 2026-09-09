package com.nexuswavetech.nexusplus

import android.graphics.BitmapFactory
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.tom_roush.pdfbox.android.PDFBoxResourceLoader
import com.tom_roush.pdfbox.multipdf.PDFMergerUtility
import com.tom_roush.pdfbox.pdmodel.PDDocument
import com.tom_roush.pdfbox.pdmodel.PDPage
import com.tom_roush.pdfbox.pdmodel.common.PDRectangle
import com.tom_roush.pdfbox.pdmodel.encryption.AccessPermission
import com.tom_roush.pdfbox.pdmodel.encryption.StandardProtectionPolicy
import com.tom_roush.pdfbox.pdmodel.graphics.image.LosslessFactory
import java.io.File
import java.io.FileOutputStream
import java.io.IOException

class NexusPdfNativeModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "NexusPdfNative"

    @ReactMethod
    fun isAvailable(promise: Promise) {
        runCatching { ensurePdfBoxInitialized(); true }
            .onSuccess { promise.resolve(it) }
            .onFailure { promise.reject("PDF_INIT", it.message, it) }
    }

    @ReactMethod
    fun merge(inputPaths: ReadableArray, outputPath: String, promise: Promise) {
        runCatching {
            ensurePdfBoxInitialized()
            require(inputPaths.size() > 0) { "At least one PDF input is required." }
            val output = File(outputPath)
            output.parentFile?.mkdirs()
            val merger = PDFMergerUtility().apply { destinationFileName = output.absolutePath }
            for (index in 0 until inputPaths.size()) merger.addSource(File(requireArrayString(inputPaths, index)))
            merger.mergeDocuments(null)
            output.absolutePath
        }.onSuccess { promise.resolve(it) }.onFailure { promise.reject("PDF_MERGE", it.message, it) }
    }

    @ReactMethod
    fun imageToPdf(inputPaths: ReadableArray, outputPath: String, quality: Int, promise: Promise) {
        runCatching {
            ensurePdfBoxInitialized()
            require(inputPaths.size() > 0) { "At least one image input is required." }
            val output = File(outputPath)
            output.parentFile?.mkdirs()
            PDDocument().use { document ->
                for (index in 0 until inputPaths.size()) {
                    val imageFile = File(requireArrayString(inputPaths, index))
                    val bitmap = BitmapFactory.decodeFile(imageFile.absolutePath) ?: throw IOException("Unable to decode image: ${imageFile.name}")
                    try {
                        val width = bitmap.width.toFloat().coerceAtLeast(1f)
                        val height = bitmap.height.toFloat().coerceAtLeast(1f)
                        val page = PDPage(PDRectangle(width, height))
                        document.addPage(page)
                        val image = LosslessFactory.createFromImage(document, bitmap)
                        com.tom_roush.pdfbox.pdmodel.PDPageContentStream(document, page).use { content -> content.drawImage(image, 0f, 0f, width, height) }
                    } finally { bitmap.recycle() }
                }
                FileOutputStream(output).use { document.save(it) }
            }
            output.absolutePath
        }.onSuccess { promise.resolve(it) }.onFailure { promise.reject("PDF_IMAGE", it.message, it) }
    }

    @ReactMethod
    fun protect(inputPath: String, outputPath: String, password: String, promise: Promise) {
        runCatching {
            ensurePdfBoxInitialized()
            require(password.length >= 8) { "PDF password must be at least 8 characters." }
            val output = File(outputPath)
            output.parentFile?.mkdirs()
            PDDocument.load(File(requireReadablePath(inputPath))).use { document ->
                val permissions = AccessPermission().apply { setCanPrint(true); setCanExtractContent(false); setCanModify(false) }
                val policy = StandardProtectionPolicy(password, password, permissions).apply { encryptionKeyLength = 256 }
                document.protect(policy)
                FileOutputStream(output).use { document.save(it) }
            }
            output.absolutePath
        }.onSuccess { promise.resolve(it) }.onFailure { promise.reject("PDF_PROTECT", it.message, it) }
    }

    @ReactMethod
    fun unlock(inputPath: String, outputPath: String, password: String, promise: Promise) {
        runCatching {
            ensurePdfBoxInitialized()
            require(password.isNotEmpty()) { "PDF password is required." }
            val output = File(outputPath)
            output.parentFile?.mkdirs()
            PDDocument.load(File(requireReadablePath(inputPath)), password).use { document ->
                document.setAllSecurityToBeRemoved(true)
                FileOutputStream(output).use { document.save(it) }
            }
            output.absolutePath
        }.onSuccess { promise.resolve(it) }.onFailure { promise.reject("PDF_UNLOCK", it.message, it) }
    }

    @ReactMethod
    fun split(inputPath: String, outputDirectory: String, pageRanges: ReadableArray, promise: Promise) {
        runCatching {
            ensurePdfBoxInitialized()
            val input = File(requireReadablePath(inputPath))
            val outputDir = File(outputDirectory).apply { mkdirs() }
            require(outputDir.isDirectory && outputDir.canWrite()) { "PDF split output directory is unavailable." }
            require(pageRanges.size() > 0 && pageRanges.size() <= 100) { "At least one page range is required." }
            PDDocument.load(input).use { source ->
                val pageCount = source.numberOfPages
                val results = mutableListOf<String>()
                for (index in 0 until pageRanges.size()) {
                    val range = requireArrayString(pageRanges, index).trim()
                    val match = Regex("^(\\d+)(?:-(\\d+))?$").matchEntire(range) ?: throw IllegalArgumentException("Invalid page range: $range")
                    val start = match.groupValues[1].toInt()
                    val end = if (match.groupValues[2].isEmpty()) start else match.groupValues[2].toInt()
                    require(start in 1..pageCount && end in 1..pageCount) { "Page range is outside the document: $range" }
                    val first = minOf(start, end)
                    val last = maxOf(start, end)
                    PDDocument().use { part ->
                        for (pageIndex in first - 1 until last) part.importPage(source.getPage(pageIndex))
                        val output = File(outputDir, "part-${index + 1}-${first}-${last}.pdf")
                        FileOutputStream(output).use { part.save(it) }
                        results += output.absolutePath
                    }
                }
                results
            }
        }.onSuccess { promise.resolve(it) }.onFailure { promise.reject("PDF_SPLIT", it.message, it) }
    }

    @ReactMethod
    fun reorder(inputPath: String, outputPath: String, pageOrder: ReadableArray, promise: Promise) {
        runCatching {
            ensurePdfBoxInitialized()
            val input = File(requireReadablePath(inputPath))
            val output = File(outputPath)
            output.parentFile?.mkdirs()
            require(pageOrder.size() > 0 && pageOrder.size() <= 1000) { "A valid page order is required." }
            PDDocument.load(input).use { source ->
                val pageCount = source.numberOfPages
                val requested = (0 until pageOrder.size()).map { index ->
                    pageOrder.getInt(index).also { require(it in 1..pageCount) { "Page number is outside the document: $it" } }
                }
                require(requested.size == pageCount) { "Page order must contain every page exactly once." }
                require(requested.toSet().size == pageCount) { "Page order must contain every page exactly once." }
                PDDocument().use { reordered ->
                    for (pageNumber in requested) reordered.importPage(source.getPage(pageNumber - 1))
                    FileOutputStream(output).use { reordered.save(it) }
                }
            }
            output.absolutePath
        }.onSuccess { promise.resolve(it) }.onFailure { promise.reject("PDF_REORDER", it.message, it) }
    }

    @ReactMethod
    fun rotate(inputPath: String, outputPath: String, pageRanges: ReadableArray, degrees: Int, promise: Promise) {
        runCatching {
            ensurePdfBoxInitialized()
            require(degrees == 90 || degrees == 180 || degrees == 270) { "Rotation must be 90, 180, or 270 degrees." }
            val output = File(outputPath)
            output.parentFile?.mkdirs()
            PDDocument.load(File(requireReadablePath(inputPath))).use { document ->
                val pageCount = document.numberOfPages
                require(pageRanges.size() > 0 && pageRanges.size() <= 100) { "Select at least one page range." }
                val pages = pageRangesToPages(pageRanges, pageCount)
                for (pageNumber in pages) {
                    val page = document.getPage(pageNumber - 1)
                    val current = ((page.rotation % 360) + 360) % 360
                    page.rotation = (current + degrees) % 360
                }
                FileOutputStream(output).use { document.save(it) }
            }
            output.absolutePath
        }.onSuccess { promise.resolve(it) }.onFailure { promise.reject("PDF_ROTATE", it.message, it) }
    }

    @ReactMethod
    fun compress(inputPath: String, outputPath: String, quality: Int, promise: Promise) {
        runCatching {
            ensurePdfBoxInitialized()
            val output = File(outputPath)
            output.parentFile?.mkdirs()
            PDDocument.load(File(requireReadablePath(inputPath))).use { document -> FileOutputStream(output).use { document.save(it) } }
            output.absolutePath
        }.onSuccess { promise.resolve(it) }.onFailure { promise.reject("PDF_COMPRESS", it.message, it) }
    }

    @ReactMethod
    fun preparePdfOutput(category: String, filename: String, promise: Promise) {
        runCatching {
            val safeCategory = sanitizePathSegment(category, "General PDFs")
            val safeFilename = sanitizePdfFilename(filename)
            val root = File(reactContext.getExternalFilesDir(null), "Nexus Plus/PDF Tools")
            val directory = File(root, safeCategory).apply { mkdirs() }
            require(directory.isDirectory && directory.canWrite()) { "Nexus Plus PDF storage is unavailable." }
            File(directory, uniqueFilename(directory, safeFilename)).absolutePath
        }.onSuccess { promise.resolve(it) }.onFailure { promise.reject("PDF_STORAGE", it.message, it) }
    }

    private fun pageRangesToPages(values: ReadableArray, pageCount: Int): Set<Int> {
        val pages = linkedSetOf<Int>()
        for (index in 0 until values.size()) {
            val range = requireArrayString(values, index)
            val match = Regex("^(\\d+)(?:-(\\d+))?$").matchEntire(range.trim())
                ?: throw IllegalArgumentException("Invalid page range: $range")
            val start = match.groupValues[1].toInt()
            val end = if (match.groupValues[2].isEmpty()) start else match.groupValues[2].toInt()
            require(start in 1..pageCount && end in 1..pageCount) { "Page range is outside the document: $range" }
            for (page in minOf(start, end)..maxOf(start, end)) pages.add(page)
        }
        return pages
    }

    private fun uniqueFilename(directory: File, desired: String): String {
        val base = desired.removeSuffix(".pdf")
        var candidate = "$base.pdf"
        var counter = 2
        while (File(directory, candidate).exists()) {
            candidate = "$base-$counter.pdf"
            counter += 1
        }
        return candidate
    }

    private fun sanitizePathSegment(value: String, fallback: String): String {
        val sanitized = value.replace(Regex("[^a-zA-Z0-9 _-]"), "_").trim().take(80)
        return sanitized.ifEmpty { fallback }
    }

    private fun sanitizePdfFilename(value: String): String {
        val sanitized = value.removeSuffix(".pdf").replace(Regex("[^a-zA-Z0-9._ -]"), "_").trim().take(140)
        require(sanitized.isNotEmpty()) { "A PDF filename is required." }
        return "$sanitized.pdf"
    }

    private fun ensurePdfBoxInitialized() { PDFBoxResourceLoader.init(reactContext) }

    private fun requireArrayString(values: ReadableArray, index: Int): String {
        val value = values.getString(index)?.trim()
        require(!value.isNullOrEmpty()) { "Input path at index $index is missing." }
        return requireReadablePath(value)
    }

    private fun requireReadablePath(path: String): String {
        require(path.isNotBlank()) { "A PDF/image path is required." }
        require(!path.startsWith("content://")) { "Content URI must be materialized to an app-accessible file before native PDF processing." }
        val file = File(path)
        require(file.exists() && file.canRead()) { "Input file is unavailable: $path" }
        return file.absolutePath
    }
}
