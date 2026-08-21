package com.nexuswavetech.nexusplus

import android.content.Context
import android.os.Build
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.security.KeyStore
import java.util.Base64
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties

class NexusVaultModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    companion object {
        private const val MODULE = "NexusVault"
        private const val KEY_ALIAS = "nexusplus.biometric-vault.master-key.v1"
        private const val META_FILE = "vault_meta.json"
    }

    override fun getName(): String = MODULE

    @ReactMethod
    fun isAvailable(promise: Promise) {
        try {
            val manager = BiometricManager.from(reactContext)
            val result = manager.canAuthenticate(
                BiometricManager.Authenticators.BIOMETRIC_STRONG or
                    BiometricManager.Authenticators.DEVICE_CREDENTIAL,
            )
            promise.resolve(result == BiometricManager.BIOMETRIC_SUCCESS)
        } catch (error: Throwable) {
            promise.reject("VAULT_CAPABILITY", error)
        }
    }

    @ReactMethod
    fun authenticate(reason: String, allowDeviceCredential: Boolean, promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("VAULT_ACTIVITY", "Vault authentication requires an active Android activity.")
            return
        }

        val executor = ContextCompat.getMainExecutor(activity)
        val callbackResult = arrayOfNulls<Boolean>(1)
        val latch = CountDownLatch(1)

        val authenticators = if (allowDeviceCredential) {
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
                callbackResult[0] = true
                latch.countDown()
            }

            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                callbackResult[0] = false
                latch.countDown()
            }

            override fun onAuthenticationFailed() {
                callbackResult[0] = false
            }
        })

        prompt.authenticate(promptInfo)

        Thread {
            latch.await(5, TimeUnit.MINUTES)
            reactContext.runOnUiQueueThread {
                promise.resolve(callbackResult[0] == true)
            }
        }.start()
    }

    @ReactMethod
    fun generateMasterKey(promise: Promise) {
        try {
            val key = getOrCreateKey()
            // The raw key never leaves Android Keystore. Return an opaque stable handle only.
            val handle = Base64.getEncoder().encodeToString(key.algorithm.toByteArray(Charsets.UTF_8))
            promise.resolve(handle)
        } catch (error: Throwable) {
            promise.reject("VAULT_KEY", error)
        }
    }

    @ReactMethod
    fun loadMasterKey(promise: Promise) {
        try {
            val key = getKey() ?: run {
                promise.resolve(null)
                return
            }
            val handle = Base64.getEncoder().encodeToString(key.algorithm.toByteArray(Charsets.UTF_8))
            promise.resolve(handle)
        } catch (error: Throwable) {
            promise.reject("VAULT_KEY", error)
        }
    }

    @ReactMethod
    fun deleteMasterKey(promise: Promise) {
        try {
            val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
            if (keyStore.containsAlias(KEY_ALIAS)) keyStore.deleteEntry(KEY_ALIAS)
            promise.resolve(null)
        } catch (error: Throwable) {
            promise.reject("VAULT_KEY", error)
        }
    }

    @ReactMethod
    fun saveVaultMeta(value: String, promise: Promise) {
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
    fun loadVaultMeta(promise: Promise) {
        try {
            val file = reactContext.getFileStreamPath(META_FILE)
            if (!file.exists()) {
                promise.resolve(null)
                return
            }
            val value = reactContext.openFileInput(META_FILE).bufferedReader(Charsets.UTF_8).use { it.readText() }
            promise.resolve(value)
        } catch (error: Throwable) {
            promise.reject("VAULT_STORAGE", error)
        }
    }

    @ReactMethod
    fun deleteVaultMeta(promise: Promise) {
        try {
            reactContext.deleteFile(META_FILE)
            promise.resolve(null)
        } catch (error: Throwable) {
            promise.reject("VAULT_STORAGE", error)
        }
    }

    private fun getKey(): SecretKey? {
        val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        return (keyStore.getKey(KEY_ALIAS, null) as? SecretKey)
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
            .setUserAuthenticationRequired(false)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            builder.setRandomizedEncryptionRequired(true)
        }

        generator.init(builder.build())
        return generator.generateKey()
    }
}
