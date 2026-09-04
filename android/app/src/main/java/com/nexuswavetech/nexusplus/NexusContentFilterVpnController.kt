package com.nexuswavetech.nexusplus

import android.content.Context
import android.content.Intent
import android.net.VpnService
import androidx.core.content.ContextCompat

/** Explicit user-consent controller for the local content-filter VPN. */
object NexusContentFilterVpnController {
    fun prepare(context: Context): Intent? = VpnService.prepare(context)

    fun start(context: Context) {
        val intent = Intent(context, NexusContentFilterVpnService::class.java)
            .setAction(NexusContentFilterVpnService.ACTION_START)
        ContextCompat.startForegroundService(context, intent)
    }

    fun stop(context: Context) {
        val intent = Intent(context, NexusContentFilterVpnService::class.java)
            .setAction(NexusContentFilterVpnService.ACTION_STOP)
        context.stopService(intent)
    }
}
