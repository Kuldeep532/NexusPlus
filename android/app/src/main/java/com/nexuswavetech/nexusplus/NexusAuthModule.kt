package com.nexuswavetech.nexusplus

import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential

/**
 * Android credential boundary only.
 *
 * Google Credential Manager obtains the Google ID token. Supabase is the
 * authentication system of record and exchanges that token on the JS side.
 * No Firebase SDK, Firebase session, or Firebase credential is used here.
 */
class NexusAuthModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    companion object {
        private const val MODULE = "NexusAuth"
        private const val WEB_CLIENT_ID = "156706204658-31cjudim1rjhpsecb7lgv55jj7kpfbmd.apps.googleusercontent.com"
    }

    override fun getName(): String = MODULE

    @ReactMethod
    fun signInWithGoogle(promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("AUTH_ACTIVITY", "Authentication activity is unavailable.")
            return
        }

        try {
            val credentialManager = CredentialManager.create(reactContext)
            val googleIdOption = GetGoogleIdOption.Builder()
                .setServerClientId(WEB_CLIENT_ID)
                .setFilterByAuthorizedAccounts(false)
                .setAutoSelectEnabled(false)
                .build()
            val request = GetCredentialRequest.Builder()
                .addCredentialOption(googleIdOption)
                .build()

            credentialManager.getCredentialAsync(
                activity,
                request,
                null,
                reactContext.mainExecutor,
                object : androidx.credentials.CredentialManagerCallback<androidx.credentials.GetCredentialResponse, androidx.credentials.exceptions.GetCredentialException> {
                    override fun onResult(result: androidx.credentials.GetCredentialResponse) {
                        try {
                            val credential = result.credential
                            if (credential.type != GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                                promise.reject("AUTH_CREDENTIAL", "Unsupported credential returned by Credential Manager.")
                                return
                            }

                            val googleCredential = GoogleIdTokenCredential.createFrom(credential.data)
                            promise.resolve(mapOf(
                                "provider" to "google",
                                "idToken" to googleCredential.idToken,
                                "displayName" to (googleCredential.displayName ?: ""),
                                "photoUrl" to (googleCredential.profilePictureUri?.toString()),
                            ))
                        } catch (error: Throwable) {
                            promise.reject("AUTH_GOOGLE", "Google credential processing failed.", error)
                        }
                    }

                    override fun onError(error: androidx.credentials.exceptions.GetCredentialException) {
                        promise.reject("AUTH_CREDENTIAL", "Google Credential Manager sign-in failed or was cancelled.", error)
                    }
                }
            )
        } catch (error: Throwable) {
            promise.reject("AUTH_CREDENTIAL", "Could not start Google Credential Manager.", error)
        }
    }
}
