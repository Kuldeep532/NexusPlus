package com.nexuswavetech.nexusplus

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.Typeface
import android.net.Uri
import android.os.CancellationSignal
import android.print.PageRange
import android.print.PrintAttributes
import android.print.PrintDocumentAdapter
import android.print.PrintDocumentInfo
import android.print.PrintManager
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
import com.tom_roush.pdfbox.rendering.ImageType
import com.tom_roush.pdfbox.rendering.PDFRenderer
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.io.IOException

class NexusPdfNativeModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "NexusPdfNative"

    @ReactMethod
    fun isAvailable(promise: Promise) {
        runCatching { ensurePdfBoxInitialized(); true }.onSuccess { promise.resolve(it) }.onFailure { promise.reject("PDF_INIT", it.message, it) }
    }

    @ReactMethod
    fun merge(inputPaths: ReadableArray, outputPath: String, promise: Promise) {
        runCatching {
            ensurePdfBoxInitialized(); require(inputPaths.size() > 0) { "At least one PDF input is required." }
            val output = File(outputPath); output.parentFile?.mkdirs()
            val merger = PDFMergerUtility().apply { destinationFileName = output.absolutePath }
            for (index in 0 until inputPaths.size()) merger.addSource(File(requireArrayString(inputPaths, index)))
            merger.mergeDocuments(null); output.absolutePath
        }.onSuccess { promise.resolve(it) }.onFailure { promise.reject("PDF_MERGE", it.message, it) }
    }

    @ReactMethod
    fun imageToPdf(inputPaths: ReadableArray, outputPath: String, quality: Int, promise: Promise) {
        runCatching {
            ensurePdfBoxInitialized(); require(inputPaths.size() in 1..100) { "Select between 1 and 100 images." }
            val output = File(outputPath); output.parentFile?.mkdirs()
            PDDocument().use { document ->
                for (index in 0 until inputPaths.size()) {
                    val imageFile = File(requireArrayString(inputPaths, index))
                    val bitmap = BitmapFactory.decodeFile(imageFile.absolutePath) ?: throw IOException("Unable to decode image: ${imageFile.name}")
                    try {
                        val width = bitmap.width.toFloat().coerceAtLeast(1f); val height = bitmap.height.toFloat().coerceAtLeast(1f)
                        require(width <= MAX_PDF_PAGE_POINTS && height <= MAX_PDF_PAGE_POINTS) { "Image is too large to fit safely on a PDF page: ${imageFile.name}" }
                        val page = PDPage(PDRectangle(width, height)); document.addPage(page)
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
            val input = File(requireReadablePath(inputPath)); val outputDir = File(outputDirectory).apply { mkdirs() }
            require(outputDir.isDirectory && outputDir.canWrite()) { "PDF image output directory is unavailable." }
            require(pageNumbers.size() in 1..1000) { "Select at least one PDF page." }
            val safeDpi = dpi.coerceIn(72, 600)
            val ext = when (format.lowercase()) { "png" -> "png"; "jpeg", "jpg" -> "jpg"; else -> throw IllegalArgumentException("Image format must be PNG or JPG.") }
            PDDocument.load(input).use { document ->
                val pageCount = document.numberOfPages
                val pages = (0 until pageNumbers.size()).map { index -> pageNumbers.getInt(index).also { require(it in 1..pageCount) { "Page number is outside the document: $it" } } }
                val renderer = PDFRenderer(document)
                pages.map { pageNumber ->
                    val probe = renderSafely(renderer, pageNumber - 1, safeDpi)
                    try {
                        val output = uniqueImageFile(outputDir, "page-${pageNumber.toString().padStart(4, '0')}.$ext")
                        FileOutputStream(output).use { stream ->
                            val compressed = if (ext == "png") Bitmap.CompressFormat.PNG else Bitmap.CompressFormat.JPEG
                            require(probe.compress(compressed, if (ext == "png") 100 else 95, stream)) { "Unable to encode PDF page $pageNumber." }
                        }
                        output.absolutePath
                    } finally { probe.recycle() }
                }
            }
        }.onSuccess { promise.resolve(it) }.onFailure { promise.reject("PDF_TO_IMAGES", it.message, it) }
    }

    @ReactMethod
    fun combineImages(inputPaths: ReadableArray, outputPath: String, format: String, quality: Int, promise: Promise) {
        runCatching {
            require(inputPaths.size() in 2..100) { "Select between 2 and 100 images to combine." }
            val normalized = format.lowercase(); require(normalized == "png" || normalized == "jpeg" || normalized == "jpg") { "Image format must be PNG or JPG." }
            val decoded = inputPaths.toListOfPaths().map { BitmapFactory.decodeFile(it) ?: throw IOException("Unable to decode image: ${File(it).name}") }
            try {
                val maxWidth = decoded.maxOf { it.width }; val totalHeightLong = decoded.sumOf { it.height.toLong() }
                require(maxWidth <= MAX_BITMAP_DIMENSION && totalHeightLong <= MAX_BITMAP_DIMENSION) { "Selected pages cannot fit safely into one image on this device." }
                val totalHeight = totalHeightLong.toInt(); require(maxWidth.toLong() * totalHeight.toLong() * 4L <= maxSafeBitmapBytes()) { "Selected pages cannot fit safely into one image on this device." }
                val combined = Bitmap.createBitmap(maxWidth, totalHeight, Bitmap.Config.ARGB_8888)
                try { val canvas = Canvas(combined); canvas.drawColor(Color.WHITE); var top = 0f; decoded.forEach { bitmap -> canvas.drawBitmap(bitmap, 0f, top, null); top += bitmap.height }; val output = File(outputPath); output.parentFile?.mkdirs(); FileOutputStream(output).use { stream -> val compressed = if (normalized == "png") Bitmap.CompressFormat.PNG else Bitmap.CompressFormat.JPEG; require(combined.compress(compressed, quality.coerceIn(1, 100), stream)) { "Unable to encode combined image." } }; output.absolutePath } finally { combined.recycle() }
            } finally { decoded.forEach { it.recycle() } }
        }.onSuccess { promise.resolve(it) }.onFailure { promise.reject("PDF_IMAGE_COMBINE_UNSUPPORTED", it.message, it) }
    }

    @ReactMethod fun preparePdfOutput(category: String, filename: String, promise: Promise) = prepareToolOutput(category, filename, promise)
    @ReactMethod fun preparePdfToolOutput(category: String, filename: String, promise: Promise) = prepareToolOutput(category, filename, promise)

    @ReactMethod
    fun split(inputPath: String, outputDirectory: String, pageRanges: ReadableArray, promise: Promise) {
        runCatching {
            ensurePdfBoxInitialized(); val input = File(requireReadablePath(inputPath)); val outputDir = File(outputDirectory).apply { mkdirs() }
            require(outputDir.isDirectory && outputDir.canWrite()) { "PDF split output directory is unavailable." }; require(pageRanges.size() in 1..100) { "At least one page range is required." }
            PDDocument.load(input).use { source ->
                val pageCount = source.numberOfPages; val results = mutableListOf<String>()
                for (index in 0 until pageRanges.size()) { val range = requireArrayString(pageRanges, index).trim(); val match = Regex("^(\\d+)(?:-(\\d+))?$").matchEntire(range) ?: throw IllegalArgumentException("Invalid page range: $range"); val start = match.groupValues[1].toInt(); val end = if (match.groupValues[2].isEmpty()) start else match.groupValues[2].toInt(); require(start in 1..pageCount && end in 1..pageCount) { "Page range is outside the document: $range" }; val first = minOf(start, end); val last = maxOf(start, end); PDDocument().use { part -> for (pageIndex in first - 1 until last) part.importPage(source.getPage(pageIndex)); val output = File(outputDir, "part-${index + 1}-${first}-${last}.pdf"); FileOutputStream(output).use { part.save(it) }; results += output.absolutePath } }
                results
            }
        }.onSuccess { promise.resolve(it) }.onFailure { promise.reject("PDF_SPLIT", it.message, it) }
    }

    @ReactMethod
    fun reorder(inputPath: String, outputPath: String, pageOrder: ReadableArray, promise: Promise) {
        runCatching {
            ensurePdfBoxInitialized(); val input = File(requireReadablePath(inputPath)); val output = File(outputPath); output.parentFile?.mkdirs(); require(pageOrder.size() in 1..1000) { "A valid page order is required." }
            PDDocument.load(input).use { source -> val pageCount = source.numberOfPages; val requested = (0 until pageOrder.size()).map { index -> pageOrder.getInt(index).also { require(it in 1..pageCount) { "Page number is outside the document: $it" } } }; require(requested.size == pageCount && requested.toSet().size == pageCount) { "Page order must contain every page exactly once." }; PDDocument().use { reordered -> requested.forEach { reordered.importPage(source.getPage(it - 1)) }; FileOutputStream(output).use { reordered.save(it) } } }
            output.absolutePath
        }.onSuccess { promise.resolve(it) }.onFailure { promise.reject("PDF_REORDER", it.message, it) }
    }

    @ReactMethod fun rotate(inputPath: String, outputPath: String, pageRanges: ReadableArray, degrees: Int, promise: Promise) { runCatching { ensurePdfBoxInitialized(); require(degrees == 90 || degrees == 180 || degrees == 270) { "Rotation must be 90, 180, or 270 degrees." }; val output = File(outputPath); output.parentFile?.mkdirs(); PDDocument.load(File(requireReadablePath(inputPath))).use { document -> val pages = pageRangesToPages(pageRanges, document.numberOfPages); pages.forEach { page -> val current = ((document.getPage(page - 1).rotation % 360) + 360) % 360; document.getPage(page - 1).rotation = (current + degrees) % 360 }; FileOutputStream(output).use { document.save(it) } }; output.absolutePath }.onSuccess { promise.resolve(it) }.onFailure { promise.reject("PDF_ROTATE", it.message, it) } }
    @ReactMethod fun compress(inputPath: String, outputPath: String, quality: Int, promise: Promise) { runCatching { ensurePdfBoxInitialized(); val output = File(outputPath); output.parentFile?.mkdirs(); PDDocument.load(File(requireReadablePath(inputPath))).use { document -> FileOutputStream(output).use { document.save(it) } }; output.absolutePath }.onSuccess { promise.resolve(it) }.onFailure { promise.reject("PDF_COMPRESS", it.message, it) } }
    @ReactMethod fun protect(inputPath: String, outputPath: String, password: String, promise: Promise) { runCatching { ensurePdfBoxInitialized(); require(password.length >= 8) { "PDF password must be at least 8 characters." }; val output = File(outputPath); output.parentFile?.mkdirs(); PDDocument.load(File(requireReadablePath(inputPath))).use { document -> val permissions = AccessPermission().apply { setCanPrint(true); setCanExtractContent(false); setCanModify(false) }; document.protect(StandardProtectionPolicy(password, password, permissions).apply { encryptionKeyLength = 256 }); FileOutputStream(output).use { document.save(it) } }; output.absolutePath }.onSuccess { promise.resolve(it) }.onFailure { promise.reject("PDF_PROTECT", it.message, it) } }
    @ReactMethod fun unlock(inputPath: String, outputPath: String, password: String, promise: Promise) { runCatching { ensurePdfBoxInitialized(); require(password.isNotEmpty()) { "PDF password is required." }; val output = File(outputPath); output.parentFile?.mkdirs(); PDDocument.load(File(requireReadablePath(inputPath)), password).use { document -> document.setAllSecurityToBeRemoved(true); FileOutputStream(output).use { document.save(it) } }; output.absolutePath }.onSuccess { promise.resolve(it) }.onFailure { promise.reject("PDF_UNLOCK", it.message, it) } }

    @ReactMethod
    fun renderEPaperToPdf(documentJson: String, outputPath: String, dpi: Int, promise: Promise) {
        runCatching {
            ensurePdfBoxInitialized()
            val json = JSONObject(documentJson); val output = File(outputPath); output.parentFile?.mkdirs()
            val paper = paperPoints(json); val safeDpi = chooseDpi(paper.first, paper.second, dpi); val bitmapWidth = (paper.first * safeDpi / 72f).roundToIntSafe(); val bitmapHeight = (paper.second * safeDpi / 72f).roundToIntSafe()
            require(bitmapWidth.toLong() * bitmapHeight.toLong() * 4L <= maxSafeBitmapBytes()) { "E-paper page is too large for this device. Lower the export DPI." }
            PDDocument().use { document ->
                val pages = json.optJSONArray("pages") ?: JSONArray()
                require(pages.length() > 0) { "E-paper has no pages to export." }
                for (pageIndex in 0 until pages.length()) {
                    val pageJson = pages.getJSONObject(pageIndex)
                    val bitmap = Bitmap.createBitmap(bitmapWidth, bitmapHeight, Bitmap.Config.ARGB_8888)
                    try {
                        val canvas = Canvas(bitmap); canvas.drawColor(parseColor(json.optString("background", "#FFFFFF")))
                        renderPage(canvas, pageJson, paper.first, paper.second, safeDpi)
                        val page = PDPage(PDRectangle(paper.first.toFloat(), paper.second.toFloat())); document.addPage(page)
                        val image = LosslessFactory.createFromImage(document, bitmap)
                        com.tom_roush.pdfbox.pdmodel.PDPageContentStream(document, page).use { content -> content.drawImage(image, 0f, 0f, paper.first.toFloat(), paper.second.toFloat()) }
                    } finally { bitmap.recycle() }
                }
                document.documentInformation.title = json.optString("title", "Nexus Plus E-Paper")
                document.documentInformation.author = json.optString("publisher", "Nexus Plus")
                document.documentInformation.subject = "Print-ready E-Paper"
                FileOutputStream(output).use { document.save(it) }
            }
            output.absolutePath
        }.onSuccess { promise.resolve(it) }.onFailure { promise.reject("EPAPER_PDF", it.message, it) }
    }

    @ReactMethod
    fun printPdf(inputPath: String, jobName: String, promise: Promise) {
        runCatching {
            val file = File(requireReadablePath(inputPath)); val attributes = printAttributesForPdf(file)
            val printManager = reactContext.getSystemService(Context.PRINT_SERVICE) as PrintManager
            printManager.print(jobName.trim(), object : PrintDocumentAdapter() {
                override fun onLayout(oldAttributes: PrintAttributes?, newAttributes: PrintAttributes, cancellationSignal: CancellationSignal, callback: LayoutResultCallback, extras: android.os.Bundle?) {
                    if (cancellationSignal.isCanceled) { callback.onLayoutCancelled(); return }
                    callback.onLayoutFinished(PrintDocumentInfo.Builder(file.name).setContentType(PrintDocumentInfo.CONTENT_TYPE_DOCUMENT).setPageCount(pageCount(file)).build(), true)
                }
                override fun onWrite(pageRanges: Array<out PageRange>, destination: android.os.ParcelFileDescriptor, cancellationSignal: CancellationSignal, callback: WriteResultCallback) {
                    try { FileOutputStream(destination.fileDescriptor).use { out -> file.inputStream().use { input -> input.copyTo(out) } }; if (cancellationSignal.isCanceled) callback.onWriteCancelled() else callback.onWriteFinished(arrayOf(PageRange.ALL_PAGES)) } catch (error: Exception) { callback.onWriteFailed(error.message) }
                }
            }, attributes)
            true
        }.onSuccess { promise.resolve(it) }.onFailure { promise.reject("EPAPER_PRINT", it.message, it) }
    }

    private fun renderPage(canvas: Canvas, page: JSONObject, paperWidth: Double, paperHeight: Double, dpi: Int) {
        val scale = dpi / 72f; val elements = page.optJSONArray("elements") ?: JSONArray(); val ordered = (0 until elements.length()).map { elements.getJSONObject(it) }.filter { it.optBoolean("visible", true) }.sortedBy { it.optInt("zIndex", 0) }
        for (element in ordered) { val x = element.optDouble("x", 0.0).toFloat() * scale; val y = element.optDouble("y", 0.0).toFloat() * scale; val width = element.optDouble("width", 0.0).toFloat() * scale; val height = element.optDouble("height", 0.0).toFloat() * scale; val centerX = x + width / 2f; val centerY = y + height / 2f; val rotation = element.optDouble("rotation", 0.0).toFloat(); val opacity = (element.optDouble("opacity", 1.0) * 255).toInt().coerceIn(0, 255); canvas.save(); canvas.rotate(rotation, centerX, centerY); try { when (element.optString("type")) { "image" -> drawImage(canvas, element, x, y, width, height, opacity); "divider" -> drawDivider(canvas, element, x, y, width, height, opacity); "headline", "subheadline", "body", "caption", "quote", "label" -> drawText(canvas, element, x, y, width, height, scale, opacity) } } finally { canvas.restore() } }
    }

    private fun drawText(canvas: Canvas, element: JSONObject, x: Float, y: Float, width: Float, height: Float, scale: Float, opacity: Int) {
        val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = parseColor(element.optString("color", "#111111")); alpha = opacity; textSize = element.optDouble("fontSize", 12.0).toFloat() * scale; typeface = Typeface.create(Typeface.DEFAULT, if (element.optString("fontWeight", "400").toIntOrNull()?.let { it >= 700 } == true) Typeface.BOLD else Typeface.NORMAL) }
        val text = element.optString("text", ""); val lines = wrapText(text, paint, width); val lineHeight = element.optDouble("lineHeight", paint.textSize * 1.25).toFloat() * scale; var baseline = y - paint.ascent(); val align = element.optString("align", "left"); paint.textAlign = when (align) { "center" -> Paint.Align.CENTER; "right" -> Paint.Align.RIGHT; else -> Paint.Align.LEFT }; val drawX = when (paint.textAlign) { Paint.Align.CENTER -> x + width / 2f; Paint.Align.RIGHT -> x + width; else -> x }; for (line in lines) { if (baseline > y + height + paint.textSize) break; canvas.drawText(line, drawX, baseline, paint); baseline += lineHeight }
    }

    private fun drawDivider(canvas: Canvas, element: JSONObject, x: Float, y: Float, width: Float, height: Float, opacity: Int) { val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = parseColor(element.optString("color", "#1F4D7A")); alpha = opacity; strokeWidth = element.optDouble("thickness", 1.0).toFloat() }; canvas.drawLine(x, y + height / 2f, x + width, y + height / 2f, paint) }

    private fun drawImage(canvas: Canvas, element: JSONObject, x: Float, y: Float, width: Float, height: Float, opacity: Int) {
        val path = resolveImagePath(element.optString("uri", "")) ?: return; val bitmap = BitmapFactory.decodeFile(path) ?: return
        try { val dst = RectF(x, y, x + width, y + height); val src = sourceRect(bitmap.width, bitmap.height, width, height, element.optString("fit", "cover")); val paint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG).apply { alpha = opacity }; canvas.drawBitmap(bitmap, src, dst, paint) } finally { bitmap.recycle() }
    }

    private fun sourceRect(sourceWidth: Int, sourceHeight: Int, targetWidth: Float, targetHeight: Float, fit: String): Rect { if (fit == "fill") return Rect(0, 0, sourceWidth, sourceHeight); val sourceRatio = sourceWidth.toFloat() / sourceHeight.toFloat(); val targetRatio = targetWidth / targetHeight; return if ((fit == "contain" && sourceRatio > targetRatio) || (fit == "cover" && sourceRatio < targetRatio)) { val cropHeight = (sourceWidth / targetRatio).toInt().coerceAtMost(sourceHeight); val top = (sourceHeight - cropHeight) / 2; Rect(0, top, sourceWidth, top + cropHeight) } else { val cropWidth = (sourceHeight * targetRatio).toInt().coerceAtMost(sourceWidth); val left = (sourceWidth - cropWidth) / 2; Rect(left, 0, left + cropWidth, sourceHeight) } }

    private fun wrapText(text: String, paint: Paint, maxWidth: Float): List<String> { val result = mutableListOf<String>(); for (paragraph in text.replace("\\r", "").split("\\n")) { val words = paragraph.trim().split(Regex("\\s+")).filter { it.isNotEmpty() }; if (words.isEmpty()) { result += ""; continue }; var line = ""; for (word in words) { val candidate = if (line.isEmpty()) word else "$line $word"; if (paint.measureText(candidate) <= maxWidth || line.isEmpty()) line = candidate else { result += line; line = word } }; if (line.isNotEmpty()) result += line }; return result.ifEmpty { listOf("") } }

    private fun paperPoints(json: JSONObject): Pair<Double, Double> { val size = json.optString("paperSize", "a4"); val base = when (size) { "a3" -> 841.89 to 1190.55; "letter" -> 612.0 to 792.0; "tabloid" -> 792.0 to 1224.0; "custom" -> json.optDouble("customWidth", 595.28) to json.optDouble("customHeight", 841.89); else -> 595.28 to 841.89 }; return if (json.optString("orientation", "portrait") == "landscape") base.second to base.first else base }
    private fun chooseDpi(widthPt: Double, heightPt: Double, requested: Int): Int { var dpi = requested.coerceIn(72, 300); while (dpi > 72 && widthPt * dpi / 72.0 * heightPt * dpi / 72.0 * 4.0 > maxSafeBitmapBytes().toDouble()) dpi -= 12; return dpi.coerceAtLeast(72) }
    private fun parseColor(value: String): Int = try { Color.parseColor(value) } catch (_: Exception) { Color.BLACK }
    private fun resolveImagePath(value: String): String? { if (value.isBlank()) return null; return try { val uri = Uri.parse(value); if (uri.scheme == null || uri.scheme == "file") uri.path ?: value else null } catch (_: Exception) { null } }
    private fun pageCount(file: File): Int = runCatching { ensurePdfBoxInitialized(); PDDocument.load(file).use { it.numberOfPages } }.getOrDefault(1)
    private fun printAttributesForPdf(file: File): PrintAttributes { val size = runCatching { ensurePdfBoxInitialized(); PDDocument.load(file).use { document -> val box = document.getPage(0).mediaBox; val widthMils = ((box.width / 72f) * 1000).toInt(); val heightMils = ((box.height / 72f) * 1000).toInt(); widthMils to heightMils } }.getOrElse { 827 to 1169 }; val media = PrintAttributes.MediaSize("NEXUS_EPAPER", "E-Paper", size.first, size.second); return PrintAttributes.Builder().setMediaSize(media).setResolution(PrintAttributes.Resolution("NEXUS_EPAPER", "E-Paper", 300, 300)).setMinMargins(PrintAttributes.Margins.NO_MARGINS).build() }
    private fun renderSafely(renderer: PDFRenderer, pageIndex: Int, dpi: Int): Bitmap { val scale = dpi / 72f; val pageSize = renderer.document.getPage(pageIndex).mediaBox; val width = (pageSize.width * scale).toInt().coerceAtLeast(1); val height = (pageSize.height * scale).toInt().coerceAtLeast(1); require(width <= MAX_BITMAP_DIMENSION && height <= MAX_BITMAP_DIMENSION) { "PDF page is too large to render safely at ${dpi} DPI." }; require(width.toLong() * height.toLong() * 4L <= maxSafeBitmapBytes()) { "PDF page is too large to render safely at ${dpi} DPI." }; return renderer.renderImageWithDPI(pageIndex, dpi.toFloat(), ImageType.RGB) }
    private fun prepareToolOutput(category: String, filename: String, promise: Promise) { runCatching { val safeCategory = sanitizePathSegment(category, "General"); val safeFilename = sanitizeFilename(filename, "output"); val root = File(reactContext.getExternalFilesDir(null), "Nexus Plus/PDF Tools"); val directory = File(root, safeCategory).apply { mkdirs() }; require(directory.isDirectory && directory.canWrite()) { "Nexus Plus PDF storage is unavailable." }; File(directory, uniqueFilename(directory, safeFilename)).absolutePath }.onSuccess { promise.resolve(it) }.onFailure { promise.reject("PDF_STORAGE", it.message, it) } }
    private fun pageRangesToPages(values: ReadableArray, pageCount: Int): Set<Int> { val pages = linkedSetOf<Int>(); for (index in 0 until values.size()) { val range = requireArrayString(values, index); val match = Regex("^(\\d+)(?:-(\\d+))?$").matchEntire(range.trim()) ?: throw IllegalArgumentException("Invalid page range: $range"); val start = match.groupValues[1].toInt(); val end = if (match.groupValues[2].isEmpty()) start else match.groupValues[2].toInt(); require(start in 1..pageCount && end in 1..pageCount) { "Page range is outside the document: $range" }; for (page in minOf(start, end)..maxOf(start, end)) pages.add(page) }; require(pages.isNotEmpty()) { "Select at least one page." }; return pages }
    private fun maxSafeBitmapBytes(): Long = (Runtime.getRuntime().maxMemory() * 0.18).toLong().coerceAtMost(64L * 1024L * 1024L)
    private fun uniqueImageFile(directory: File, desired: String): File { if (!File(directory, desired).exists()) return File(directory, desired); val dot = desired.lastIndexOf('.'); val base = if (dot > 0) desired.substring(0, dot) else desired; val ext = if (dot > 0) desired.substring(dot) else ""; var n = 2; var candidate = File(directory, "$base-$n$ext"); while (candidate.exists()) { n++; candidate = File(directory, "$base-$n$ext") }; return candidate }
    private fun uniqueFilename(directory: File, desired: String): String { if (!File(directory, desired).exists()) return desired; val dot = desired.lastIndexOf('.'); val base = if (dot > 0) desired.substring(0, dot) else desired; val ext = if (dot > 0) desired.substring(dot) else ""; var n = 2; var candidate = "$base-$n$ext"; while (File(directory, candidate).exists()) { n++; candidate = "$base-$n$ext" }; return candidate }
    private fun sanitizePathSegment(value: String, fallback: String): String { val sanitized = value.replace(Regex("[^a-zA-Z0-9 _-]"), "_").trim().take(80); return sanitized.ifEmpty { fallback } }
    private fun sanitizeFilename(value: String, fallback: String): String { val sanitized = value.replace(Regex("[^a-zA-Z0-9._ -]"), "_").trim().take(140); return sanitized.ifEmpty { fallback } }
    private fun ensurePdfBoxInitialized() { PDFBoxResourceLoader.init(reactContext) }
    private fun requireArrayString(values: ReadableArray, index: Int): String { val value = values.getString(index)?.trim(); require(!value.isNullOrEmpty()) { "Input path at index $index is missing." }; return requireReadablePath(value) }
    private fun ReadableArray.toListOfPaths(): List<String> = (0 until size()).map { requireArrayString(this, it) }
    private fun requireReadablePath(path: String): String { require(path.isNotBlank()) { "A PDF/image path is required." }; require(!path.startsWith("content://")) { "Content URI must be materialized to an app-accessible file before native PDF processing." }; val file = File(path); require(file.exists() && file.canRead()) { "Input file is unavailable: $path" }; return file.absolutePath }
    private fun Double.roundToIntSafe(): Int = kotlin.math.round(this).toInt().coerceAtLeast(1)
    companion object { private const val MAX_BITMAP_DIMENSION = 32768; private const val MAX_PDF_PAGE_POINTS = 14400f }
}
