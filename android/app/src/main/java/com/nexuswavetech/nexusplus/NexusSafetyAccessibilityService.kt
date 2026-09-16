package com.nexuswavetech.nexusplus

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent

/**
 * Minimal, privacy-preserving service used only to verify that the user has
 * explicitly enabled Nexus Plus accessibility protection.
 *
 * The service does not inspect, store, upload, or alter window content and
 * does not intercept gestures, keys, notifications, or clipboard data.
 */
class NexusSafetyAccessibilityService : AccessibilityService() {
    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Intentionally no-op. State is read by NexusSafetyGateModule directly
        // from Settings.Secure, so there is no reason to process user content.
    }

    override fun onInterrupt() {
        // Nothing to interrupt because this service performs no active work.
    }
}
