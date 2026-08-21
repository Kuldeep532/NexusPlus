package com.nexuswavetech.nexusplus

import android.app.AlarmManager
import android.content.Context
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class NexusAlarmModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "NexusAlarm"

    @ReactMethod
    fun canScheduleExactAlarms(promise: Promise) {
        promise.resolve(AlarmPermission.canUseExactAlarms(reactContext))
    }

    @ReactMethod
    fun schedule(id: String, hour: Int, minute: Int, promise: Promise) {
        try {
            requireValid(id, hour, minute)
            val alarmManager = reactContext.getSystemService(AlarmManager::class.java)
                ?: throw IllegalStateException("Alarm service is unavailable.")
            if (!AlarmPermission.canUseExactAlarms(reactContext)) {
                promise.resolve(Arguments.makeNativeMap(mapOf("scheduled" to false, "reason" to "exact_alarm_permission")))
                return
            }
            AlarmScheduler.schedule(reactContext, id, hour, minute)
            promise.resolve(Arguments.makeNativeMap(mapOf("scheduled" to true)))
        } catch (error: Throwable) {
            promise.reject("ALARM_SCHEDULE", error.message ?: "Unable to schedule alarm.", null)
        }
    }

    @ReactMethod
    fun cancel(id: String, promise: Promise) {
        try {
            require(id.isNotBlank() && id.length <= 128) { "Invalid alarm id." }
            AlarmScheduler.cancel(reactContext, id)
            promise.resolve(true)
        } catch (error: Throwable) {
            promise.reject("ALARM_CANCEL", error.message ?: "Unable to cancel alarm.", null)
        }
    }

    private fun requireValid(id: String, hour: Int, minute: Int) {
        require(id.isNotBlank() && id.length <= 128) { "Invalid alarm id." }
        require(hour in 0..23) { "Invalid alarm hour." }
        require(minute in 0..59) { "Invalid alarm minute." }
    }
}
