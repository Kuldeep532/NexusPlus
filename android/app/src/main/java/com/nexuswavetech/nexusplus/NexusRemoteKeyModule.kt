package com.nexuswavetech.nexusplus

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.Signature
import java.util.Base64

/** Device-bound signing authority for remote computer pairing/unlock. */
class NexusRemoteKeyModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    companion object {
        private const val MODULE = "NexusRemoteKey"
        private const val ANDROID_KEYSTORE = "AndroidKeyStore"
        // v2 is authentication-bound; v1 was intentionally superseded because it was not Keystore-auth protected.
        private const val ALIAS = "nexus.remote.computer.v2"
    }

    override fun getName(): String = MODULE

    private fun ensureKey() {
        val store = KeyStore.getInstance(ANDROID_KEYSTORE).apply { load(null) }
        if (store.containsAlias(ALIAS)) return
        val generator = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_EC, ANDROID_KEYSTORE)
        generator.initialize(
            KeyGenParameterSpec.Builder(ALIAS, KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY)
                .setDigests(KeyProperties.DIGEST_SHA256)
                .setUserAuthenticationRequired(true)
                .setUserAuthenticationValidityDurationSeconds(30)
                .build(),
        )
        generator.generateKeyPair()
    }

    @ReactMethod
    fun getPublicKey(promise: Promise) {
        try {
            ensureKey()
            val store = KeyStore.getInstance(ANDROID_KEYSTORE).apply { load(null) }
            val certificate = store.getCertificate(ALIAS)
            promise.resolve(mapOf(
                "keyId" to ALIAS,
                "algorithm" to "ECDSA-P256-SHA256-AUTHENTICATED",
                "publicKey" to Base64.getEncoder().encodeToString(certificate.publicKey.encoded),
            ))
        } catch (error: Throwable) {
            promise.reject("REMOTE_KEY_PUBLIC", "Could not access the device-bound public key.", error)
        }
    }

    @ReactMethod
    fun signChallenge(challenge: String, promise: Promise) {
        if (challenge.isBlank() || challenge.length > 4096) {
            promise.reject("REMOTE_KEY_INPUT", "Challenge is required and must be at most 4096 characters.")
            return
        }
        try {
            ensureKey()
            val store = KeyStore.getInstance(ANDROID_KEYSTORE).apply { load(null) }
            val privateKey = store.getKey(ALIAS, null)
            val signature = Signature.getInstance("SHA256withECDSA").apply {
                initSign(privateKey as java.security.PrivateKey)
                update(challenge.toByteArray(Charsets.UTF_8))
            }
            // Android Keystore refuses this operation unless the user has recently authenticated.
            promise.resolve(Base64.getEncoder().encodeToString(signature.sign()))
        } catch (error: Throwable) {
            promise.reject("REMOTE_KEY_SIGN", "Could not sign the remote challenge. Authenticate with the phone biometric prompt first.", error)
        }
    }
}
