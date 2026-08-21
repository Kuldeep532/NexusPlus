package com.nexuswavetech.nexusplus

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import org.json.JSONArray

class BootReceiver : BroadcastReceiver() {
    companion object {
        private const val ALARM_STORE_KEY = "nexus-plus.time-assisted.alarms.v1"
    }

    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_TIME_CHANGED,
            Intent.ACTION_TIMEZONE_CHANGED,
            -> reschedulePersistedAlarms(context)
        }
    }

    private fun reschedulePersistedAlarms(context: Context) {
        try {
            val prefs = context.getSharedPreferences("nexus-plus-alarm-bridge", Context.MODE_PRIVATE)
            val raw = prefs.getString(ALARM_STORE_KEY, null) ?: return
            val alarms = JSONArray(raw)
            for (index in 0 until alarms.length()) {
                val alarm = alarms.optJSONObject(index) ?: continue
                if (!alarm.optBoolean("enabled", false)) continue
                val id = alarm.optString("id")
                val hour = alarm.optInt("hour", -1)
                val minute = alarm.optInt("minute", -1)
                if (id.isBlank() || id.length > 128 || hour !in 0..23 || minute !in 0..59) continue
                if (AlarmPermission.canUseExactAlarms(context)) {
                    AlarmScheduler.schedule(context, id, hour, minute)
                }
            }
        } catch (_: Throwable) {
            // Boot recovery is best-effort; malformed persisted state must never crash the receiver.
        }
    }
}
