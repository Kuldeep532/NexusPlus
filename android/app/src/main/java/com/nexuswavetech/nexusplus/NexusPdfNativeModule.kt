package com.nexuswavetech.nexusplus

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.tom_roush.pdfbox.android.PDFBoxResourceLoader
import com.tom_roush.pdfbox.pdmodel.PDDocument
import com.tom_roush.pdfbox.pdmodel.PDPage
import com.tom_roush.pdfbox.pdmodel.common.PDRectangle
import com.tom_roush.pdfbox.pdmodel.encryption.AccessPermission
import com.tom_roush.pdfbox.pdmodel.encryption.StandardProtectionPolicy
import com.tom_roush.pdfbox.pdmodel.graphics.image.LosslessFactory
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.IOException

class NexusPdfNativeModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "NexusPdfNative"

    init {
        runCatching { PDFBoxResourceLoader.init(reactContext) }
    }

    @ReactMethod
    fun isAvailable(promise: Promise) {
        promise.resolve(true)
    }

    @ReactMethod
    fun merge(inputPaths: ReadableArray, outputPath: String, promise: Promise) {
        runCatching {
            val output = File(outputPath)
            output.parentFile?.mkdirs()
            val merged = PDDocument()
            try {
                for (index in 0 until inputPaths.size()) {
                    val input = requireReadablePath(inputPaths.getString(index))
                    PDDocument.load(input).use { source ->
                        for (page in source.pages) {
                            val imported = PDPage(page.mediaBox)
                            imported.rotation = page.rotation
                            merged.addPage(imported)
                        }
                    }
                }
                FileOutputStream(output).use { merged.save(it) }
            } finally {
                merged.close()
            }
            output.absolutePath
        }.onSuccess { promise.resolve(it) }
         .onFailure { promise.reject("PDF_MERGE", it.message, it) }
    }

    @ReactMethod
    fun imageToPdf(inputPaths: ReadableArray, outputPath: String, quality: Int, promise: Promise) {
        runCatching {
            val output = File(outputPath)
            output.parentFile?.mkdirs()
            val document = PDDocument()
            try {
                for (index in 0 until inputPaths.size()) {
                    val imageFile = File(requireReadablePath(inputPaths.getString(index)))
                    val bitmap = BitmapFactory.decodeFile(imageFile.absolutePath)
                        ?: throw IOException("Unable to decode image: ${imageFile.name}")
                    val width = bitmap.width.toFloat().coerceAtLeast(1f)
                    val height = bitmap.height.toFloat().coerceAtLeast(1f)
                    val page = PDPage(PDRectangle(width, height))
                    document.addPage(page)
                    val image = LosslessFactory.createFromImage(document, bitmap)
                    val content = com.tom_roush.pdfbox.pdmodel.PDPageContentStream(document, page)
                    content.drawImage(image, 0f, 0f, width, height)
                    content.close()
                    bitmap.recycle()
                }
                FileOutputStream(output).use { document.save(it) }
            } finally {
                document.close()
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
            PDDocument.load(requireReadablePath(inputPath)).use { document ->
                val permissions = AccessPermission().apply {
                    canPrint = true
                    canExtractContent = false
                    canModify = false
                }
                val policy = StandardProtectionPolicy(password, password, permissions).apply {
                    encryptionKeyLength = 256
                    permissions = permissions
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
            PDDocument.load(requireReadablePath(inputPath), password).use { document ->
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
            PDDocument.load(requireReadablePath(inputPath)).use { document ->
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
