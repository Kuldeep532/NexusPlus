package com.nexuswavetech.nexusplus

import android.provider.Settings
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class NexusVisionAssistModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    override fun getName(): String = "NexusVisionAssist"

    @ReactMethod
    fun getState(promise: Promise) {
        runCatching {
            val prefs = context.getSharedPreferences("nexus_vision_assist", 0)
            val snapshot = prefs.getString("accessibility_snapshot", null)
            Arguments.createMap().apply {
                putBoolean("accessibilityEnabled", isAccessibilityEnabled())
                putBoolean("hasSnapshot", !snapshot.isNullOrBlank())
                putString("snapshot", snapshot)
                putDouble("updatedAt", prefs.getLong("updatedAt", 0L).toDouble())
            }
        }.onSuccess(promise::resolve).onFailure { promise.reject("VISION_STATE", it.message, it) }
    }

    private fun isAccessibilityEnabled(): Boolean {
        val enabled = Settings.Secure.getString(context.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES) ?: return false
        val packageName = context.packageName
        return enabled.split(':').any { it.startsWith("$packageName/") }
    }
}

class NexusVisionAssistPackage : com.facebook.react.ReactPackage {
    override fun createNativeModules(context: ReactApplicationContext) = listOf(NexusVisionAssistModule(context))
    override fun createViewManagers(context: ReactApplicationContext) = emptyList<com.facebook.react.uimanager.ViewManager<*, *>>()
}
