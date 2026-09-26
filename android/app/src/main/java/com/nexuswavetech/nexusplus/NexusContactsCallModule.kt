package com.nexuswavetech.nexusplus

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.provider.ContactsContract
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class NexusContactsCallModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "NexusContactsCall"

    @ReactMethod
    fun findContacts(query: String, promise: Promise) {
        try {
            val value = query.trim()
            require(value.isNotEmpty()) { "Contact name is required." }

            val projection = arrayOf(
                ContactsContract.Contacts._ID,
                ContactsContract.Contacts.DISPLAY_NAME,
                ContactsContract.Contacts.HAS_PHONE_NUMBER,
            )
            val results = mutableListOf<com.facebook.react.bridge.WritableMap>()
            reactContext.contentResolver.query(
                ContactsContract.Contacts.CONTENT_URI,
                projection,
                ContactsContract.Contacts.DISPLAY_NAME + " LIKE ?",
                arrayOf("%$value%"),
                ContactsContract.Contacts.DISPLAY_NAME + " COLLATE NOCASE ASC",
            )?.use { cursor ->
                val idIndex = cursor.getColumnIndexOrThrow(ContactsContract.Contacts._ID)
                val nameIndex = cursor.getColumnIndexOrThrow(ContactsContract.Contacts.DISPLAY_NAME)
                val phoneIndex = cursor.getColumnIndexOrThrow(ContactsContract.Contacts.HAS_PHONE_NUMBER)

                while (cursor.moveToNext() && results.size < 5) {
                    if (cursor.getInt(phoneIndex) <= 0) continue
                    val contactId = cursor.getString(idIndex)
                    val name = cursor.getString(nameIndex)
                    val phone = findFirstPhoneNumber(contactId)
                    if (!phone.isNullOrBlank()) {
                        results += Arguments.createMap().apply {
                            putString("id", contactId)
                            putString("name", name)
                            putString("phone", phone)
                        }
                    }
                }
            }
            promise.resolve(Arguments.fromList(results))
        } catch (error: SecurityException) {
            promise.reject("CONTACT_PERMISSION", "Contacts permission is required to search your contacts.", null)
        } catch (error: Throwable) {
            promise.reject("CONTACT_SEARCH", error.message ?: "Unable to search contacts.", null)
        }
    }

    @ReactMethod
    fun requestContactsPermission(promise: Promise) {
        if (ContextCompat.checkSelfPermission(reactContext, Manifest.permission.READ_CONTACTS) == PackageManager.PERMISSION_GRANTED) {
            promise.resolve(true)
            return
        }
        promise.resolve(false)
    }

    @ReactMethod
    fun requestCallPermission(promise: Promise) {
        promise.resolve(ContextCompat.checkSelfPermission(reactContext, Manifest.permission.CALL_PHONE) == PackageManager.PERMISSION_GRANTED)
    }

    @ReactMethod
    fun directCall(phone: String, promise: Promise) {
        try {
            val number = phone.trim()
            require(number.isNotEmpty()) { "Phone number is required." }
            val allowed = ContextCompat.checkSelfPermission(reactContext, Manifest.permission.CALL_PHONE) == PackageManager.PERMISSION_GRANTED
            if (!allowed) {
                promise.reject("CALL_PERMISSION", "Phone permission is required before a direct call can be placed.", null)
                return
            }
            val intent = Intent(Intent.ACTION_CALL, Uri.parse("tel:" + Uri.encode(number))).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            if (intent.resolveActivity(reactContext.packageManager) == null) {
                promise.reject("CALL_UNAVAILABLE", "No phone app is available for outgoing calls.", null)
                return
            }
            reactContext.startActivity(intent)
            promise.resolve(true)
        } catch (error: SecurityException) {
            promise.reject("CALL_PERMISSION", "Phone permission is required before a direct call can be placed.", null)
        } catch (error: Throwable) {
            promise.reject("CALL_FAILED", error.message ?: "Unable to start the call.", null)
        }
    }

    @ReactMethod
    fun dial(phone: String, promise: Promise) {
        try {
            val number = phone.trim()
            require(number.isNotEmpty()) { "Phone number is required." }
            val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:" + Uri.encode(number))).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            if (intent.resolveActivity(reactContext.packageManager) == null) {
                promise.resolve(false)
                return
            }
            reactContext.startActivity(intent)
            promise.resolve(true)
        } catch (error: Throwable) {
            promise.reject("DIAL_FAILED", error.message ?: "Unable to open the dialer.", null)
        }
    }

    private fun findFirstPhoneNumber(contactId: String): String? {
        reactContext.contentResolver.query(
            ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
            arrayOf(ContactsContract.CommonDataKinds.Phone.NUMBER),
            ContactsContract.CommonDataKinds.Phone.CONTACT_ID + " = ?",
            arrayOf(contactId),
            ContactsContract.CommonDataKinds.Phone.IS_PRIMARY + " DESC",
        )?.use { cursor ->
            if (cursor.moveToFirst()) {
                val index = cursor.getColumnIndexOrThrow(ContactsContract.CommonDataKinds.Phone.NUMBER)
                return cursor.getString(index)
            }
        }
        return null
    }
}
