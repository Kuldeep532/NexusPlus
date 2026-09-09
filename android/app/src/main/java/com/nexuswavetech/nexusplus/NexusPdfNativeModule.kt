package com.nexuswavetech.nexusplus

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Rect
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
            require(inputPaths.size() <= 100) { "A maximum of 100 images can be converted at once." }
            val output = File(outputPath)
            output.parentFile?.mkdirs()
            PDDocument().use { document ->
                for (index in 0 until inputPaths.size()) {
                    val imageFile = File(requireArrayString(inputPaths, index))
                    val bitmap = BitmapFactory.decodeFile(imageFile.absolutePath) ?: throw IOException("Unable to decode image: ${imageFile.name}")
                    try {
                        val width = bitmap.width.toFloat().coerceAtLeast(1f)
                        val height = bitmap.height.toFloat().coerceAtLeast(1f)
                        require(width <= MAX_PDF_PAGE_POINTS && height <= MAX_PDF_PAGE_POINTS) { "Image is too large to fit safely on a PDF page: ${imageFile.name}" }
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
    fun pdfToImages(inputPath: String, outputDirectory: String, pageNumbers: ReadableArray, dpi: Int, format: String, promise: Promise) {
        runCatching {
            ensurePdfBoxInitialized()
            val input = File(requireReadablePath(inputPath))
            val outputDir = File(outputDirectory).apply { mkdirs() }
            require(outputDir.isDirectory && outputDir.canWrite()) { "PDF image output directory is unavailable." }
            require(pageNumbers.size() > 0 && pageNumbers.size() <= 1000) { "At least one PDF page is required." }
            val safeDpi = dpi.coerceIn(72, 600)
            val ext = when (format.lowercase()) {
                "png" -> "png"
                "jpeg", "jpg" -> "jpg"
                else -> throw IllegalArgumentException("Image format must be PNG or JPG.")
            }
            PDDocument.load(input).use { document ->
                val pageCount = document.numberOfPages
                val pages = (0 until pageNumbers.size()).map { index ->
                    pageNumbers.getInt(index).also { require(it in 1..pageCount) { "Page number is outside the document: $it" } }
                }
                pages.mapIndexed { index, pageNumber ->
                    val page = document.getPage(pageNumber - 1)
                    val mediaBox = page.mediaBox
                    val scale = safeDpi / 72f
                    val width = (mediaBox.width * scale).roundToSafeInt()
                    val height = (mediaBox.height * scale).roundToSafeInt()
                    require(width <= MAX_BITMAP_DIMENSION && height <= MAX_BITMAP_DIMENSION) {
                        "PDF page $pageNumber is too large to render safely at ${safeDpi} DPI."
                    }
                    val requiredBytes = width.toLong() * height.toLong() * 4L
                    require(requiredBytes <= maxSafeBitmapBytes()) {
                        "PDF page $pageNumber is too large to render safely at ${safeDpi} DPI."
                    }
                    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
                    try {
                        val canvas = Canvas(bitmap)
                        canvas.drawColor(android.graphics.Color.WHITE)
                        val rendererClass = Class.forName("com.tom_roush.pdfbox.rendering.PDFRenderer")
                        val renderer = rendererClass.getConstructor(PDDocument::class.java).newInstance(document)
                        val image = rendererClass.getMethod("renderImageWithDPI", Int::class.javaPrimitiveType, Float::class.javaPrimitiveType, com.tom_roush.pdfbox.rendering.ImageType::class.java)
                            .invoke(renderer, pageNumber - 1, safeDpi.toFloat(), com.tom_roush.pdfbox.rendering.ImageType.RGB) as Bitmap
                        try {
                            canvas.drawBitmap(image, null, Rect(0, 0, width, height), null)
                        } finally { image.recycle() }
                        val output = uniqueImageFile(outputDir, "page-${pageNumber.toString().padStart(4, '0')}.$ext")
                        FileOutputStream(output).use { stream ->
                            val compressed = if (ext == "png") Bitmap.CompressFormat.PNG else Bitmap.CompressFormat.JPEG
                            val quality = if (ext == "png") 100 else 95
                            require(bitmap.compress(compressed, quality, stream)) { "Unable to encode PDF page $pageNumber as $ext." }
                        }
                        output.absolutePath
                    } finally { bitmap.recycle() }
                }
            }
        }.onSuccess { promise.resolve(it) }.onFailure { promise.reject("PDF_TO_IMAGES", it.message, it) }
    }

    @ReactMethod
    fun combineImages(inputPaths: ReadableArray, outputPath: String, format: String, quality: Int, promise: Promise) {
        runCatching {
            require(inputPaths.size() > 1) { "At least two images are required to combine." }
            require(inputPaths.size() <= 100) { "A maximum of 100 images can be combined." }
            val normalizedFormat = format.lowercase()
            require(normalizedFormat == "png" || normalizedFormat == "jpeg" || normalizedFormat == "jpg") { "Image format must be PNG or JPG." }
            val decoded = inputPaths.toListOfPaths().map { path -> BitmapFactory.decodeFile(path) ?: throw IOException("Unable to decode image: ${File(path).name}") }
            try {
                val maxWidth = decoded.maxOf { it.width }
                val totalHeight = decoded.sumOf { it.height.toLong() }.also { require(it <= MAX_BITMAP_DIMENSION) { "Combined image is too tall for a safe bitmap." } }.toInt()
                val requiredBytes = maxWidth.toLong() * totalHeight.toLong() * 4L
                require(maxWidth <= MAX_BITMAP_DIMENSION && requiredBytes <= maxSafeBitmapBytes()) { "Selected pages cannot fit safely into one image on this device." }
                val combined = Bitmap.createBitmap(maxWidth, totalHeight, Bitmap.Config.ARGB_8888)
                try {
                    val canvas = Canvas(combined)
                    canvas.drawColor(android.graphics.Color.WHITE)
                    var top = 0
                    decoded.forEach { bitmap ->
                        canvas.drawBitmap(bitmap, 0f, top.toFloat(), null)
                        top += bitmap.height
                    }
                    val output = File(outputPath)
                    output.parentFile?.mkdirs()
                    FileOutputStream(output).use { stream ->
                        val compressed = if (normalizedFormat == "png") Bitmap.CompressFormat.PNG else Bitmap.CompressFormat.JPEG
                        val safeQuality = quality.coerceIn(1, 100)
                        require(combined.compress(compressed, safeQuality, stream)) { "Unable to encode the combined image." }
                    }
                    output.absolutePath
                } finally { combined.recycle() }
            } finally { decoded.forEach { it.recycle() } }
        }.onSuccess { promise.resolve(it) }.onFailure { promise.reject("PDF_IMAGE_COMBINE_UNSUPPORTED", it.message, it) }
    }

    @ReactMethod
    fun preparePdfOutput(category: String, filename: String, promise: Promise) {
        runCatching {
            val safeCategory = sanitizePathSegment(category, "General")
            val safeFilename = sanitizeFilename(filename, "output")
            val root = File(reactContext.getExternalFilesDir(null), "Nexus Plus/PDF Tools")
            val directory = File(root, safeCategory).apply { mkdirs() }
            require(directory.isDirectory && directory.canWrite()) { "Nexus Plus PDF storage is unavailable." }
            File(directory, uniqueFilename(directory, safeFilename)).absolutePath
        }.onSuccess { promise.resolve(it) }.onFailure { promise.reject("PDF_STORAGE", it.message, it) }
    }

    @ReactMethod
    fun preparePdfToolOutput(category: String, filename: String, promise: Promise) {
        runCatching {
            val safeCategory = sanitizePathSegment(category, "General")
            val safeFilename = sanitizeFilename(filename, "output")
            val root = File(reactContext.getExternalFilesDir(null), "Nexus Plus/PDF Tools")
            val directory = File(root, safeCategory).apply { mkdirs() }
            require(directory.isDirectory && directory.canWrite()) { "Nexus Plus PDF storage is unavailable." }
            File(directory, uniqueFilename(directory, safeFilename)).absolutePath
        }.onSuccess { promise.resolve(it) }.onFailure { promise.reject("PDF_STORAGE", it.message, it) }
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

    private fun maxSafeBitmapBytes(): Long = (Runtime.getRuntime().maxMemory() * 0.18).toLong().coerceAtMost(64L * 1024L * 1024L)

    private fun Int.roundToSafeInt(): Int = this.coerceAtLeast(1)

    private fun uniqueImageFile(directory: File, desired: String): File {
        if (!File(directory, desired).exists()) return File(directory, desired)
        val dot = desired.lastIndexOf('.')
        val base = if (dot > 0) desired.substring(0, dot) else desired
        val ext = if (dot > 0) desired.substring(dot) else ""
        var counter = 2
        var candidate = File(directory, "$base-$counter$ext")
        while (candidate.exists()) { counter += 1; candidate = File(directory, "$base-$counter$ext") }
        return candidate
    }

    private fun uniqueFilename(directory: File, desired: String): String {
        val dot = desired.lastIndexOf('.')
        val base = if (dot > 0) desired.substring(0, dot) else desired
        val ext = if (dot > 0) desired.substring(dot) else ""
        var candidate = desired
        var counter = 2
        while (File(directory, candidate).exists()) { candidate = "$base-$counter$ext"; counter += 1 }
        return candidate
    }

    private fun sanitizePathSegment(value: String, fallback: String): String {
        val sanitized = value.replace(Regex("[^a-zA-Z0-9 _-]"), "_").trim().take(80)
        return sanitized.ifEmpty { fallback }
    }

    private fun sanitizeFilename(value: String, fallback: String): String {
        val sanitized = value.replace(Regex("[^a-zA-Z0-9._ -]"), "_").trim().take(140)
        return sanitized.ifEmpty { fallback }
    }

    private fun ensurePdfBoxInitialized() { PDFBoxResourceLoader.init(reactContext) }

    private fun requireArrayString(values: ReadableArray, index: Int): String {
        val value = values.getString(index)?.trim()
        require(!value.isNullOrEmpty()) { "Input path at index $index is missing." }
        return requireReadablePath(value)
    }

    private fun ReadableArray.toListOfPaths(): List<String> = (0 until size()).map { requireArrayString(this, it) }

    private fun requireReadablePath(path: String): String {
        require(path.isNotBlank()) { "A PDF/image path is required." }
        require(!path.startsWith("content://")) { "Content URI must be materialized to an app-accessible file before native PDF processing." }
        val file = File(path)
        require(file.exists() && file.canRead()) { "Input file is unavailable: $path" }
        return file.absolutePath
    }

    private fun pageRangesToPages(values: ReadableArray, pageCount: Int): Set<Int> {
        val pages = linkedSetOf<Int>()
        for (index in 0 until values.size()) {
            val range = requireArrayString(values, index)
            val match = Regex("^(\\d+)(?:-(\\d+))?$").matchEntire(range.trim()) ?: throw IllegalArgumentException("Invalid page range: $range")
            val start = match.groupValues[1].toInt()
            val end = if (match.groupValues[2].isEmpty()) start else match.groupValues[2].toInt()
            require(start in 1..pageCount && end in 1..pageCount) { "Page range is outside the document: $range" }
            for (page in minOf(start, end)..maxOf(start, end)) pages.add(page)
        }
        return pages
    }

    companion object {
        private const val MAX_BITMAP_DIMENSION = 32768
        private const val MAX_PDF_PAGE_POINTS = 14400f
    }
}
