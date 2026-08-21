package com.nexuswavetech.nexusplus

import android.app.Activity
import android.content.Context
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider

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
            androidx.core.os.CancellationSignalProvider().getCancellationSignal(),
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
                        val idToken = googleCredential.idToken
                        FirebaseAuth.getInstance()
                            .signInWithCredential(GoogleAuthProvider.getCredential(idToken, null))
                            .addOnSuccessListener { authResult ->
                                val user = authResult.user
                                if (user == null) {
                                    promise.reject("AUTH_USER", "Firebase did not return a signed-in user.")
                                    return@addOnSuccessListener
                                }
                                promise.resolve(mapOf(
                                    "uid" to user.uid,
                                    "email" to (user.email ?: ""),
                                    "displayName" to (user.displayName ?: ""),
                                    "photoUrl" to (user.photoUrl?.toString()),
                                    "provider" to "google",
                                    "idToken" to idToken,
                                ))
                            }
                            .addOnFailureListener { error ->
                                promise.reject("AUTH_FIREBASE", "Firebase Google authentication failed.", error)
                            }
                    } catch (error: Throwable) {
                        promise.reject("AUTH_GOOGLE", "Google credential processing failed.", error)
                    }
                }

                override fun onError(error: androidx.credentials.exceptions.GetCredentialException) {
                    promise.reject("AUTH_CREDENTIAL", "Google Credential Manager sign-in failed or was cancelled.", error)
                }
            }
        )
    }

    @ReactMethod
    fun signOut(promise: Promise) {
        try {
            FirebaseAuth.getInstance().signOut()
            promise.resolve(null)
        } catch (error: Throwable) {
            promise.reject("AUTH_SIGNOUT", "Could not sign out.", error)
        }
    }

    @ReactMethod
    fun getCurrentUser(promise: Promise) {
        try {
            val user = FirebaseAuth.getInstance().currentUser
            if (user == null) {
                promise.resolve(null)
                return
            }
            user.getIdToken(false)
                .addOnSuccessListener { tokenResult ->
                    promise.resolve(mapOf(
                        "uid" to user.uid,
                        "email" to (user.email ?: ""),
                        "displayName" to (user.displayName ?: ""),
                        "photoUrl" to (user.photoUrl?.toString()),
                        "provider" to "google",
                        "idToken" to tokenResult.token,
                    ))
                }
                .addOnFailureListener { error ->
                    promise.reject("AUTH_TOKEN", "Could not refresh Firebase ID token.", error)
                }
        } catch (error: Throwable) {
            promise.reject("AUTH_CURRENT", "Could not inspect current auth state.", error)
        }
    }
}
