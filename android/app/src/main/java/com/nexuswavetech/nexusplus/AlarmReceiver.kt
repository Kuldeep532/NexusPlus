package com.nexuswavetech.nexusplus

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class AlarmReceiver : BroadcastReceiver() {
    companion object {
        private const val ACTION_ALARM = "com.nexuswavetech.nexusplus.ACTION_ALARM"
        private const val EXTRA_ALARM_ID = "alarm_id"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != ACTION_ALARM) return
        val alarmId = intent.getStringExtra(EXTRA_ALARM_ID)?.takeIf { it.isNotBlank() } ?: return
        context.startActivity(
            Intent(context, AlarmRingActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                putExtra(EXTRA_ALARM_ID, alarmId)
            },
        )
    }
}
