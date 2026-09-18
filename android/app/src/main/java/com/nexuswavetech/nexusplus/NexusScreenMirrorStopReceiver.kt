package com.nexuswavetech.nexusplus

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class NexusScreenMirrorStopReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        NexusScreenMirrorService.stopAll(context)
    }
}
