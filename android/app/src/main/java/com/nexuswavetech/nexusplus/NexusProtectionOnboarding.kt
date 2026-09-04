package com.nexuswavetech.nexusplus

import android.content.Context
import android.content.Intent
import android.net.VpnService

/** First-run protection coordinator. Android permissions remain user-controlled. */
object NexusProtectionOnboarding {
    enum class Step { ACCESSIBILITY, VPN, READY }

    fun nextStep(context: Context): Step {
        if (!NexusSafetyGate.isSafetyAccessibilityEnabled(context)) return Step.ACCESSIBILITY
        if (VpnService.prepare(context) != null || !NexusVpnPolicy.hasConsent(context)) return Step.VPN
        return Step.READY
    }

    fun openAccessibility(context: Context) = NexusSafetyGate.openAccessibilitySettings(context)

    fun prepareVpn(context: Context): Intent? = VpnService.prepare(context)

    fun markAcknowledged(context: Context) = NexusSafetyGate.acknowledge(context)
}
