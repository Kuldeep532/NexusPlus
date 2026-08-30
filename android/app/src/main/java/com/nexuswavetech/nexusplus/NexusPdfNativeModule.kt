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

    init {
        PDFBoxResourceLoader.init(reactContext)
    }

    @ReactMethod
    fun isAvailable(promise: Promise) {
        promise.resolve(true)
    }

    @ReactMethod
    fun merge(inputPaths: ReadableArray, outputPath: String, promise: Promise) {
        runCatching {
            require(inputPaths.size() > 0) { "At least one PDF input is required." }
            val output = File(outputPath)
            output.parentFile?.mkdirs()
            val merger = PDFMergerUtility().apply {
                destinationFileName = output.absolutePath
            }
            for (index in 0 until inputPaths.size()) {
                merger.addSource(File(requireReadablePath(inputPaths.getString(index))))
            }
            merger.mergeDocuments(null)
            output.absolutePath
        }.onSuccess { promise.resolve(it) }
            .onFailure { promise.reject("PDF_MERGE", it.message, it) }
    }

    @ReactMethod
    fun imageToPdf(inputPaths: ReadableArray, outputPath: String, quality: Int, promise: Promise) {
        runCatching {
            require(inputPaths.size() > 0) { "At least one image input is required." }
            val output = File(outputPath)
            output.parentFile?.mkdirs()
            PDDocument().use { document ->
                for (index in 0 until inputPaths.size()) {
                    val imageFile = File(requireReadablePath(inputPaths.getString(index)))
                    val bitmap = BitmapFactory.decodeFile(imageFile.absolutePath)
                        ?: throw IOException("Unable to decode image: ${imageFile.name}")
                    try {
                        val width = bitmap.width.toFloat().coerceAtLeast(1f)
                        val height = bitmap.height.toFloat().coerceAtLeast(1f)
                        val page = PDPage(PDRectangle(width, height))
                        document.addPage(page)
                        val image = LosslessFactory.createFromImage(document, bitmap)
                        com.tom_roush.pdfbox.pdmodel.PDPageContentStream(document, page).use { content ->
                            content.drawImage(image, 0f, 0f, width, height)
                        }
                    } finally {
                        bitmap.recycle()
                    }
                }
                FileOutputStream(output).use { document.save(it) }
            }
            output.absolutePath
        }.onSuccess { promise.resolve(it) }
            .onFailure { promise.reject("PDF_IMAGE", it.message, it) }
    }

    @ReactMethod
    fun protect(inputPath: String, outputPath: String, password: String, promise: Promise) {
        runCatching {
            require(password.length >= 8) { "PDF password must be at least 8 characters." }
            val output = File(outputPath)
            output.parentFile?.mkdirs()
            PDDocument.load(File(requireReadablePath(inputPath))).use { document ->
                val permissions = AccessPermission().apply {
                    setCanPrint(true)
                    setCanExtractContent(false)
                    setCanModify(false)
                }
                val policy = StandardProtectionPolicy(password, password, permissions).apply {
                    encryptionKeyLength = 256
                }
                document.protect(policy)
                FileOutputStream(output).use { document.save(it) }
            }
            output.absolutePath
        }.onSuccess { promise.resolve(it) }
            .onFailure { promise.reject("PDF_PROTECT", it.message, it) }
    }

    @ReactMethod
    fun unlock(inputPath: String, outputPath: String, password: String, promise: Promise) {
        runCatching {
            require(password.isNotEmpty()) { "PDF password is required." }
            val output = File(outputPath)
            output.parentFile?.mkdirs()
            PDDocument.load(File(requireReadablePath(inputPath)), password).use { document ->
                document.setAllSecurityToBeRemoved(true)
                FileOutputStream(output).use { document.save(it) }
            }
            output.absolutePath
        }.onSuccess { promise.resolve(it) }
            .onFailure { promise.reject("PDF_UNLOCK", it.message, it) }
    }

    @ReactMethod
    fun compress(inputPath: String, outputPath: String, quality: Int, promise: Promise) {
        runCatching {
            val output = File(outputPath)
            output.parentFile?.mkdirs()
            PDDocument.load(File(requireReadablePath(inputPath))).use { document ->
                FileOutputStream(output).use { document.save(it) }
            }
            output.absolutePath
        }.onSuccess { promise.resolve(it) }
            .onFailure { promise.reject("PDF_COMPRESS", it.message, it) }
    }

    private fun requireReadablePath(path: String): String {
        require(path.isNotBlank()) { "A PDF/image path is required." }
        require(!path.startsWith("content://")) {
            "Content URI must be materialized to an app-accessible file before native PDF processing."
        }
        val file = File(path)
        require(file.exists() && file.canRead()) { "Input file is unavailable: $path" }
        return file.absolutePath
    }
}
