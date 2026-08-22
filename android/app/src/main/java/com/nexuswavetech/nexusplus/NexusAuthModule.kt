package com.nexuswavetech.nexusplus

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
import com.google.firebase.auth.UserProfileChangeRequest

class NexusAuthModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    companion object {
        private const val MODULE = "NexusAuth"
        private const val WEB_CLIENT_ID = "156706204658-31cjudim1rjhpsecb7lgv55jj7kpfbmd.apps.googleusercontent.com"
    }

    override fun getName(): String = MODULE

    private fun resolveCurrentUser(promise: Promise, provider: String) {
        val user = FirebaseAuth.getInstance().currentUser
        if (user == null) {
            promise.reject("AUTH_USER", "Firebase did not return a signed-in user.")
            return
        }
        user.getIdToken(false)
            .addOnSuccessListener { tokenResult ->
                promise.resolve(mapOf(
                    "uid" to user.uid,
                    "email" to (user.email ?: ""),
                    "displayName" to (user.displayName ?: ""),
                    "photoUrl" to (user.photoUrl?.toString()),
                    "provider" to provider,
                    "idToken" to tokenResult.token,
                ))
            }
            .addOnFailureListener { error ->
                promise.reject("AUTH_TOKEN", "Could not obtain Firebase ID token.", error)
            }
    }

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
        val request = GetCredentialRequest.Builder().addCredentialOption(googleIdOption).build()

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
                        FirebaseAuth.getInstance()
                            .signInWithCredential(GoogleAuthProvider.getCredential(googleCredential.idToken, null))
                            .addOnSuccessListener { resolveCurrentUser(promise, "google") }
                            .addOnFailureListener { error -> promise.reject("AUTH_FIREBASE", "Firebase Google authentication failed.", error) }
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
    fun signInWithEmail(email: String, password: String, promise: Promise) {
        val safeEmail = email.trim()
        if (safeEmail.isBlank() || password.isBlank()) {
            promise.reject("AUTH_INPUT", "Email and password are required.")
            return
        }
        FirebaseAuth.getInstance()
            .signInWithEmailAndPassword(safeEmail, password)
            .addOnSuccessListener { resolveCurrentUser(promise, "password") }
            .addOnFailureListener { error -> promise.reject("AUTH_EMAIL", "Email sign-in failed.", error) }
    }

    @ReactMethod
    fun registerWithEmail(name: String, email: String, password: String, promise: Promise) {
        val safeName = name.trim()
        val safeEmail = email.trim()
        if (safeName.length !in 1..80 || safeEmail.isBlank() || password.length < 8) {
            promise.reject("AUTH_INPUT", "Name, valid email, and a password of at least 8 characters are required.")
            return
        }
        FirebaseAuth.getInstance()
            .createUserWithEmailAndPassword(safeEmail, password)
            .addOnSuccessListener {
                val user = FirebaseAuth.getInstance().currentUser
                if (user == null) {
                    promise.reject("AUTH_USER", "Account was created but the user session is unavailable.")
                    return@addOnSuccessListener
                }
                val request = UserProfileChangeRequest.Builder().setDisplayName(safeName).build()
                user.updateProfile(request).addOnCompleteListener { resolveCurrentUser(promise, "password") }
            }
            .addOnFailureListener { error -> promise.reject("AUTH_REGISTER", "Account creation failed.", error) }
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
                        "provider" to "firebase",
                        "idToken" to tokenResult.token,
                    ))
                }
                .addOnFailureListener { error -> promise.reject("AUTH_TOKEN", "Could not refresh Firebase ID token.", error) }
        } catch (error: Throwable) {
            promise.reject("AUTH_CURRENT", "Could not inspect current auth state.", error)
        }
    }
}
