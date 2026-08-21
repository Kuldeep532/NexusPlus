package com.nexuswavetech.nexusplus

import android.app.KeyguardManager
import android.content.Context
import android.os.Build
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
    }

    override fun getName(): String = MODULE

    @ReactMethod
    fun getBiometricCapability(promise: Promise) {
        try {
            val manager = BiometricManager.from(reactContext)
            val strong = manager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)
            val device = manager.canAuthenticate(BiometricManager.Authenticators.DEVICE_CREDENTIAL)
            val hardware = strong != BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE
            val enrolled = strong == BiometricManager.BIOMETRIC_SUCCESS || device == BiometricManager.BIOMETRIC_SUCCESS
            val securityLevel = if (strong == BiometricManager.BIOMETRIC_SUCCESS) "strong" else if (hardware) "weak" else "none"
            promise.resolve(mapOf("hardware" to hardware, "enrolled" to enrolled, "securityLevel" to securityLevel))
        } catch (error: Throwable) {
            promise.reject("VAULT_CAPABILITY", error)
        }
    }

    @ReactMethod
    fun authenticate(reason: String, mode: String, promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("VAULT_ACTIVITY", "Vault authentication requires an active Android activity.")
            return
        }

        val manager = BiometricManager.from(activity)
        val hasStrong = manager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG) == BiometricManager.BIOMETRIC_SUCCESS
        if (!hasStrong) {
            promise.resolve(mapOf("success" to false, "error" to "biometric_unavailable"))
            return
        }

        val executor = ContextCompat.getMainExecutor(activity)
        val allowDevice = mode == "device-auth"
        val authenticators = if (allowDevice) {
            BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.DEVICE_CREDENTIAL
        } else {
            BiometricManager.Authenticators.BIOMETRIC_STRONG
        }

        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle(reason)
            .setSubtitle("Unlock Nexus Plus Vault")
            .setAllowedAuthenticators(authenticators)
            .build()

        val prompt = BiometricPrompt(activity, executor, object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                promise.resolve(mapOf("success" to true))
            }

            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                promise.resolve(mapOf("success" to false, "error" to errorCode.toString()))
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
            promise.reject("VAULT_KEY", error)
        }
    }

    @ReactMethod
    fun isKeyAvailable(promise: Promise) {
        try {
            promise.resolve(getKey() != null)
        } catch (error: Throwable) {
            promise.reject("VAULT_KEY", error)
        }
    }

    @ReactMethod
    fun deleteKey(promise: Promise) {
        try {
            val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
            if (keyStore.containsAlias(KEY_ALIAS)) keyStore.deleteEntry(KEY_ALIAS)
            promise.resolve(null)
        } catch (error: Throwable) {
            promise.reject("VAULT_KEY", error)
        }
    }

    @ReactMethod
    fun encrypt(plaintext: String, aad: String, promise: Promise) {
        try {
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
            promise.reject("VAULT_CRYPTO", error)
        }
    }

    @ReactMethod
    fun decrypt(ciphertext: String, iv: String, tag: String, aad: String, promise: Promise) {
        try {
            val key = getKey() ?: throw IllegalStateException("Vault master key is unavailable.")
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(
                Cipher.DECRYPT_MODE,
                key,
                GCMParameterSpec(128, Base64.getDecoder().decode(iv)),
            )
            cipher.updateAAD(aad.toByteArray(Charsets.UTF_8))
            val encrypted = Base64.getDecoder().decode(ciphertext) + Base64.getDecoder().decode(tag)
            val plaintext = cipher.doFinal(encrypted)
            promise.resolve(String(plaintext, Charsets.UTF_8))
        } catch (error: Throwable) {
            promise.reject("VAULT_CRYPTO", error)
        }
    }

    @ReactMethod
    fun saveMetadata(value: String, promise: Promise) {
        try {
            reactContext.openFileOutput(META_FILE, Context.MODE_PRIVATE).use { stream ->
                stream.write(value.toByteArray(Charsets.UTF_8))
            }
            promise.resolve(null)
        } catch (error: Throwable) {
            promise.reject("VAULT_STORAGE", error)
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
            promise.resolve(reactContext.openFileInput(META_FILE).bufferedReader(Charsets.UTF_8).use { it.readText() })
        } catch (error: Throwable) {
            promise.reject("VAULT_STORAGE", error)
        }
    }

    @ReactMethod
    fun deleteMetadata(promise: Promise) {
        try {
            reactContext.deleteFile(META_FILE)
            promise.resolve(null)
        } catch (error: Throwable) {
            promise.reject("VAULT_STORAGE", error)
        }
    }

    @ReactMethod
    fun saveCredentialMode(mode: String, promise: Promise) {
        try {
            reactContext.openFileOutput(MODE_FILE, Context.MODE_PRIVATE).use { it.write(mode.toByteArray(Charsets.UTF_8)) }
            promise.resolve(null)
        } catch (error: Throwable) {
            promise.reject("VAULT_STORAGE", error)
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
            val mode = reactContext.openFileInput(MODE_FILE).bufferedReader(Charsets.UTF_8).use { it.readText() }
            promise.resolve(if (mode == "device-auth") "device-auth" else "biometric-only")
        } catch (error: Throwable) {
            promise.reject("VAULT_STORAGE", error)
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

        generator.init(builder.build())
        return generator.generateKey()
    }
}
