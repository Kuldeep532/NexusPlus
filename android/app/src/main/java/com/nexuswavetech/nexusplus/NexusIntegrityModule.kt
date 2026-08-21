package com.nexuswavetech.nexusplus

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.android.play.core.integrity.IntegrityManagerFactory
import com.google.android.play.core.integrity.IntegrityTokenRequest
import java.security.MessageDigest
import java.util.Base64

class NexusIntegrityModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    companion object {
        private const val MODULE = "NexusIntegrity"
    }

    override fun getName(): String = MODULE

    @ReactMethod
    fun requestIntegrityToken(requestHash: String, promise: Promise) {
        try {
            val normalized = requestHash.trim()
            require(normalized.isNotEmpty()) { "Request hash is required." }
            val projectNumber = com.nexuswavetech.nexusplus.BuildConfig.PLAY_INTEGRITY_CLOUD_PROJECT_NUMBER
            require(projectNumber > 0L) { "Play Integrity cloud project is not configured." }

            val digest = MessageDigest.getInstance("SHA-256")
                .digest(normalized.toByteArray(Charsets.UTF_8))
            val encodedHash = Base64.getUrlEncoder().withoutPadding().encodeToString(digest)

            val manager = IntegrityManagerFactory.create(reactContext)
            val request = IntegrityTokenRequest.builder()
                .setCloudProjectNumber(projectNumber)
                .setNonce(encodedHash)
                .build()

            manager.requestIntegrityToken(request)
                .addOnSuccessListener { response ->
                    promise.resolve(response.token())
                }
                .addOnFailureListener { error ->
                    promise.reject("INTEGRITY_REQUEST", "Could not obtain Play Integrity token.", error)
                }
        } catch (error: Throwable) {
            promise.reject("INTEGRITY_REQUEST", "Play Integrity request could not be created.", error)
        }
    }
}
