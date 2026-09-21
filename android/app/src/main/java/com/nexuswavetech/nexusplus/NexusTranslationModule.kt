package com.nexuswavetech.nexusplus

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Translation boundary for Document Studio.
 *
 * The JS layer intentionally does not fall back to a remote translator.
 * A production build can attach an on-device ML Kit implementation here
 * without changing the Document Translator screen or document model.
 */
class NexusTranslationModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    override fun getName(): String = "NexusTranslation"

    @ReactMethod
    fun isAvailable(promise: Promise) = promise.resolve(false)

    @ReactMethod
    fun getAvailableLanguages(promise: Promise) = promise.resolve(Arguments.createArray())

    @ReactMethod
    fun downloadModel(source: String, target: String, promise: Promise) {
        promise.reject("TRANSLATION_ENGINE_UNAVAILABLE", "On-device ML Kit translation engine is not included in this build.")
    }

    @ReactMethod
    fun translate(text: String, source: String, target: String, promise: Promise) {
        promise.reject("TRANSLATION_ENGINE_UNAVAILABLE", "On-device ML Kit translation engine is not included in this build.")
    }
}
