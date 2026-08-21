package com.nexuswavetech.nexusplus

import android.content.Context
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import java.util.Base64
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties

class NexusVaultModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    companion object {
        private const val MODULE = "NexusVault"
        private const val KEY_ALIAS = "nexusplus.biometric-vault.master-key.v1"
        private const val META_FILE = "vault_meta.json"
        private const val MODE_FILE = "vault_credential_mode.txt"
        private const val MAX_METADATA_BYTES = 512 * 1024L
    }

    override fun getName(): String = MODULE

    @ReactMethod
    fun getBiometricCapability(promise: Promise) {
        try {
            val manager = BiometricManager.from(reactContext)
            val strong = manager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)
            val device = manager.canAuthenticate(BiometricManager.Authenticators.DEVICE_CREDENTIAL)
            val hardware = strong != BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE
            val strongEnrolled = strong == BiometricManager.BIOMETRIC_SUCCESS
            val deviceCredentialAvailable = device == BiometricManager.BIOMETRIC_SUCCESS
            val securityLevel = when {
                strongEnrolled -> "strong"
                hardware -> "weak"
                else -> "none"
            }
            promise.resolve(mapOf(
                "hardware" to hardware,
                "enrolled" to strongEnrolled,
                "deviceCredentialAvailable" to deviceCredentialAvailable,
                "securityLevel" to securityLevel,
            ))
        } catch (error: Throwable) {
            promise.reject("VAULT_CAPABILITY", "Unable to determine Vault authentication capability.", null)
        }
    }

    @ReactMethod
    fun authenticate(reason: String, mode: String, promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.resolve(mapOf("success" to false, "error" to "activity_unavailable"))
            return
        }

        val manager = BiometricManager.from(activity)
        val strongResult = manager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)
        val deviceResult = manager.canAuthenticate(BiometricManager.Authenticators.DEVICE_CREDENTIAL)
        val hasStrong = strongResult == BiometricManager.BIOMETRIC_SUCCESS
        val hasDeviceCredential = deviceResult == BiometricManager.BIOMETRIC_SUCCESS
        val allowDevice = mode == "device-auth"

        if (!hasStrong && (!allowDevice || !hasDeviceCredential)) {
            val error = if (allowDevice && !hasDeviceCredential) "credential_unavailable" else "biometric_unavailable"
            promise.resolve(mapOf("success" to false, "error" to error))
            return
        }

        val executor = ContextCompat.getMainExecutor(activity)
        val authenticators = if (allowDevice) {
            BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.DEVICE_CREDENTIAL
        } else {
            BiometricManager.Authenticators.BIOMETRIC_STRONG
        }

        val safeReason = reason.trim().take(120).ifBlank { "Unlock Nexus Biometric Vault" }
        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle(safeReason)
            .setSubtitle("Unlock Nexus Plus Vault")
            .setAllowedAuthenticators(authenticators)
            .build()

        val prompt = BiometricPrompt(activity, executor, object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                promise.resolve(mapOf("success" to true))
            }

            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                val normalized = when (errorCode) {
                    BiometricPrompt.ERROR_USER_CANCELED,
                    BiometricPrompt.ERROR_NEGATIVE_BUTTON,
                    BiometricPrompt.ERROR_CANCELED -> "user_cancel"
                    BiometricPrompt.ERROR_LOCKOUT,
                    BiometricPrompt.ERROR_LOCKOUT_PERMANENT -> "lockout"
                    BiometricPrompt.ERROR_NO_BIOMETRICS,
                    BiometricPrompt.ERROR_HW_NOT_PRESENT,
                    BiometricPrompt.ERROR_HW_UNAVAILABLE -> "biometric_unavailable"
                    else -> "unknown"
                }
                promise.resolve(mapOf("success" to false, "error" to normalized))
            }

            override fun onAuthenticationFailed() {
                // Keep the prompt open for another attempt; do not resolve the JS promise yet.
            }
        })

        prompt.authenticate(promptInfo)
    }

    @ReactMethod
    fun ensureKey(promise: Promise) {
        try {
            getOrCreateKey()
            promise.resolve(null)
        } catch (error: Throwable) {
            promise.reject("VAULT_KEY", "Unable to initialize secure Vault key.", null)
        }
    }

    @ReactMethod
    fun isKeyAvailable(promise: Promise) {
        try {
            promise.resolve(getKey() != null)
        } catch (error: Throwable) {
            promise.reject("VAULT_KEY", "Unable to inspect secure Vault key.", null)
        }
    }

    @ReactMethod
    fun deleteKey(promise: Promise) {
        try {
            val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
            if (keyStore.containsAlias(KEY_ALIAS)) keyStore.deleteEntry(KEY_ALIAS)
            promise.resolve(null)
        } catch (error: Throwable) {
            promise.reject("VAULT_KEY", "Unable to remove secure Vault key.", null)
        }
    }

    @ReactMethod
    fun encrypt(plaintext: String, aad: String, promise: Promise) {
        try {
            require(plaintext.toByteArray(Charsets.UTF_8).size <= MAX_METADATA_BYTES) {
                "Vault payload exceeds the supported size limit."
            }
            val key = getOrCreateKey()
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(Cipher.ENCRYPT_MODE, key)
            cipher.updateAAD(aad.toByteArray(Charsets.UTF_8))
            val combined = cipher.doFinal(plaintext.toByteArray(Charsets.UTF_8))
            val tagBytes = 16
            val ciphertext = combined.copyOfRange(0, combined.size - tagBytes)
            val tag = combined.copyOfRange(combined.size - tagBytes, combined.size)
            promise.resolve(mapOf(
                "ciphertext" to Base64.getEncoder().encodeToString(ciphertext),
                "iv" to Base64.getEncoder().encodeToString(cipher.iv),
                "tag" to Base64.getEncoder().encodeToString(tag),
            ))
        } catch (error: Throwable) {
            promise.reject("VAULT_CRYPTO", "Vault encryption failed.", null)
        }
    }

    @ReactMethod
    fun decrypt(ciphertext: String, iv: String, tag: String, aad: String, promise: Promise) {
        try {
            val key = getKey() ?: throw IllegalStateException("Vault master key is unavailable.")
            val ivBytes = Base64.getDecoder().decode(iv)
            val ciphertextBytes = Base64.getDecoder().decode(ciphertext)
            val tagBytes = Base64.getDecoder().decode(tag)
            require(ivBytes.size == 12 && tagBytes.size == 16) { "Invalid Vault encryption parameters." }
            require(ciphertextBytes.size <= MAX_METADATA_BYTES) { "Vault payload exceeds the supported size limit." }
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(
                Cipher.DECRYPT_MODE,
                key,
                GCMParameterSpec(128, ivBytes),
            )
            cipher.updateAAD(aad.toByteArray(Charsets.UTF_8))
            val encrypted = ciphertextBytes + tagBytes
            val plaintext = cipher.doFinal(encrypted)
            require(plaintext.size <= MAX_METADATA_BYTES) { "Vault payload exceeds the supported size limit." }
            promise.resolve(String(plaintext, Charsets.UTF_8))
        } catch (error: Throwable) {
            promise.reject("VAULT_CRYPTO", "Vault decryption failed or authentication did not succeed.", null)
        }
    }

    @ReactMethod
    fun saveMetadata(value: String, promise: Promise) {
        try {
            val bytes = value.toByteArray(Charsets.UTF_8)
            require(bytes.size <= MAX_METADATA_BYTES) { "Vault metadata exceeds the supported size limit." }
            reactContext.openFileOutput(META_FILE, Context.MODE_PRIVATE).use { stream ->
                stream.write(bytes)
            }
            promise.resolve(null)
        } catch (error: Throwable) {
            promise.reject("VAULT_STORAGE", "Unable to store Vault metadata.", null)
        }
    }

    @ReactMethod
    fun loadMetadata(promise: Promise) {
        try {
            val file = reactContext.getFileStreamPath(META_FILE)
            if (!file.exists()) {
                promise.resolve(null)
                return
            }
            require(file.isFile && file.length() <= MAX_METADATA_BYTES) { "Vault metadata is invalid or too large." }
            promise.resolve(reactContext.openFileInput(META_FILE).bufferedReader(Charsets.UTF_8).use { it.readText() })
        } catch (error: Throwable) {
            promise.reject("VAULT_STORAGE", "Unable to read Vault metadata.", null)
        }
    }

    @ReactMethod
    fun deleteMetadata(promise: Promise) {
        try {
            reactContext.deleteFile(META_FILE)
            promise.resolve(null)
        } catch (error: Throwable) {
            promise.reject("VAULT_STORAGE", "Unable to remove Vault metadata.", null)
        }
    }

    @ReactMethod
    fun saveCredentialMode(mode: String, promise: Promise) {
        try {
            require(mode == "biometric-only" || mode == "device-auth") { "Invalid Vault credential mode." }
            reactContext.openFileOutput(MODE_FILE, Context.MODE_PRIVATE).use { it.write(mode.toByteArray(Charsets.UTF_8)) }
            promise.resolve(null)
        } catch (error: Throwable) {
            promise.reject("VAULT_STORAGE", "Unable to store Vault credential mode.", null)
        }
    }

    @ReactMethod
    fun loadCredentialMode(promise: Promise) {
        try {
            val file = reactContext.getFileStreamPath(MODE_FILE)
            if (!file.exists()) {
                promise.resolve("biometric-only")
                return
            }
            require(file.isFile && file.length() <= 32) { "Vault credential mode is invalid." }
            val mode = reactContext.openFileInput(MODE_FILE).bufferedReader(Charsets.UTF_8).use { it.readText() }
            promise.resolve(if (mode == "device-auth") "device-auth" else "biometric-only")
        } catch (error: Throwable) {
            promise.reject("VAULT_STORAGE", "Unable to read Vault credential mode.", null)
        }
    }

    private fun getKey(): SecretKey? {
        val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        return keyStore.getKey(KEY_ALIAS, null) as? SecretKey
    }

    private fun getOrCreateKey(): SecretKey {
        getKey()?.let { return it }
        val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
        val builder = KeyGenParameterSpec.Builder(
            KEY_ALIAS,
            KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
        )
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256)
            .setRandomizedEncryptionRequired(true)
            .setUserAuthenticationRequired(true)

        generator.init(builder.build())
        return generator.generateKey()
    }
}
