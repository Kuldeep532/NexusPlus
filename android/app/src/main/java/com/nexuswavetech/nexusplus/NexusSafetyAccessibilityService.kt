package com.nexuswavetech.nexusplus

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent

/**
 * User-enabled safety observer. It does not silently enable itself and never
 * blocks essential package families from NexusProtectionPolicy.
 */
class NexusSafetyAccessibilityService : AccessibilityService() {
    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        val packageName = event?.packageName?.toString().orEmpty()
        if (packageName.isBlank() || NexusProtectionPolicy.isEssentialPackage(packageName)) return

        val text = buildString {
            event?.text?.forEach { append(it).append(' ') }
            event?.contentDescription?.let { append(it) }
        }

        if (text.isNotBlank() && NexusAdultSafetyPolicy.isProtectedText(text)) {
            NexusWellnessMetrics.recordBlockedEvent(this)
            performGlobalAction(GLOBAL_ACTION_HOME)
        }
    }

    override fun onInterrupt() = Unit
}
