package com.nexuswavetech.nexusplus

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.mlkit.common.model.DownloadConditions
import com.google.mlkit.nl.translate.TranslateLanguage
import com.google.mlkit.nl.translate.Translation
import com.google.mlkit.nl.translate.TranslatorOptions

class NexusTranslationModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    override fun getName(): String = "NexusTranslation"

    private fun normalize(language: String): String {
        val value = language.trim().lowercase().replace('_','-')
        return TranslateLanguage.fromLanguageTag(value) ?: value.takeIf { it.length == 2 } ?: "en"
    }

    @ReactMethod
    fun isAvailable(promise: Promise) = promise.resolve(true)

    @ReactMethod
    fun getAvailableLanguages(promise: Promise) {
        promise.resolve(Arguments.fromList(TranslateLanguage.getAllLanguages().sorted()))
    }

    @ReactMethod
    fun downloadModel(source: String, target: String, promise: Promise) {
        val sourceLang = normalize(source)
        val targetLang = normalize(target)
        if (sourceLang == targetLang) {
            promise.resolve(true)
            return
        }
        val options = TranslatorOptions.Builder().setSourceLanguage(sourceLang).setTargetLanguage(targetLang).build()
        val translator = Translation.getClient(options)
        translator.downloadModelIfNeeded(DownloadConditions.Builder().build())
            .addOnSuccessListener { translator.close(); promise.resolve(true) }
            .addOnFailureListener { error -> translator.close(); promise.reject("TRANSLATION_MODEL", error.message, error) }
    }

    @ReactMethod
    fun translate(text: String, source: String, target: String, promise: Promise) {
        val sourceLang = normalize(source)
        val targetLang = normalize(target)
        if (sourceLang == targetLang) {
            promise.resolve(text)
            return
        }
        val options = TranslatorOptions.Builder().setSourceLanguage(sourceLang).setTargetLanguage(targetLang).build()
        val translator = Translation.getClient(options)
        translator.translate(text)
            .addOnSuccessListener { translated -> translator.close(); promise.resolve(translated) }
            .addOnFailureListener { error -> translator.close(); promise.reject("TRANSLATION", error.message, error) }
    }
}
