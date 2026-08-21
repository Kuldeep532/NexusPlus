package com.nexuswavetech.nexusplus

import android.content.Intent
import android.net.Uri
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class NexusSystemSettingsModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "NexusSystemSettings"

    @ReactMethod
    fun openNotifications(promise: Promise) = open(Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
        putExtra(Settings.EXTRA_APP_PACKAGE, reactContext.packageName)
    }, promise)

    @ReactMethod
    fun openBattery(promise: Promise) = open(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS), promise)

    @ReactMethod
    fun openBiometric(promise: Promise) = open(Intent(Settings.ACTION_SECURITY_SETTINGS), promise)

    @ReactMethod
    fun openAlarm(promise: Promise) {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
            open(Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
                data = Uri.parse("package:${reactContext.packageName}")
            }, promise)
        } else {
            promise.resolve(false)
        }
    }

    private fun open(intent: Intent, promise: Promise) {
        try {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactContext.startActivity(intent)
            promise.resolve(true)
        } catch (error: Throwable) {
            promise.reject("SYSTEM_SETTINGS", error.message, error)
        }
    }
}
