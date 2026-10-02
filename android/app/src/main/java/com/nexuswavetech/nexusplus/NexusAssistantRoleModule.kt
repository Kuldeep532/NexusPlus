package com.nexuswavetech.nexusplus

import android.app.role.RoleManager
import android.content.Context
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class NexusAssistantRoleModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    override fun getName(): String = "NexusAssistantRole"

    @ReactMethod
    fun isAvailable(promise: Promise) {
        promise.resolve(Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q)
    }

    @ReactMethod
    fun isDefaultAssistant(promise: Promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            promise.resolve(false)
            return
        }
        val roleManager = context.getSystemService(RoleManager::class.java)
        promise.resolve(roleManager?.isRoleHeld(RoleManager.ROLE_ASSISTANT) == true)
    }

    @ReactMethod
    fun requestDefaultAssistant(promise: Promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            promise.resolve(false)
            return
        }
        val roleManager = context.getSystemService(RoleManager::class.java)
        if (roleManager == null || !roleManager.isRoleAvailable(RoleManager.ROLE_ASSISTANT)) {
            promise.resolve(false)
            return
        }
        if (roleManager.isRoleHeld(RoleManager.ROLE_ASSISTANT)) {
            promise.resolve(true)
            return
        }
        val intent = roleManager.createRequestRoleIntent(RoleManager.ROLE_ASSISTANT)
        val activity = context.currentActivity
        if (activity == null) {
            promise.reject("ASSISTANT_ACTIVITY_UNAVAILABLE", "Nexus Assistant needs the app screen open to request default-assistant access.")
            return
        }
        activity.startActivityForResult(intent, REQUEST_CODE)
        promise.resolve(false)
    }

    companion object {
        private const val REQUEST_CODE = 2407
    }
}
