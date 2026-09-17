package com.nexuswavetech.nexusplus

import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import org.json.JSONObject

class NexusVisionAssistModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    companion object {
        private const val PREFS = "nexus_vision_assist"
        private const val SNAPSHOT = "accessibility_snapshot"
    }

    override fun getName(): String = "NexusVisionAssist"

    @ReactMethod
    fun isAccessibilityServiceEnabled(promise: Promise) {
        runCatching { isAccessibilityEnabled() }
            .onSuccess(promise::resolve)
            .onFailure { promise.reject("VISION_ACCESSIBILITY_STATE", it.message, it) }
    }

    @ReactMethod
    fun getCurrentAccessibilitySnapshot(promise: Promise) {
        runCatching {
            val prefs = context.getSharedPreferences(PREFS, 0)
            val raw = prefs.getString(SNAPSHOT, null) ?: return@runCatching null
            val snapshot = JSONObject(raw)
            val result = Arguments.createMap()
            result.putString("packageName", snapshot.optString("packageName"))
            result.putString("windowTitle", snapshot.optString("className"))
            result.putDouble("capturedAt", prefs.getLong("updatedAt", 0L).toDouble())

            val nodes = Arguments.createArray()
            val rawNodes = snapshot.optJSONArray("nodes")
            if (rawNodes != null) {
                for (index in 0 until rawNodes.length()) {
                    val node = rawNodes.optJSONObject(index) ?: continue
                    val map = Arguments.createMap()
                    map.putString("text", node.optString("text"))
                    map.putString("contentDescription", node.optString("contentDescription"))
                    map.putString("className", node.optString("className"))
                    map.putString("viewId", node.optString("viewId"))
                    map.putBoolean("clickable", node.optBoolean("clickable"))
                    map.putBoolean("enabled", node.optBoolean("enabled", true))
                    map.putBoolean("editable", node.optBoolean("editable"))
                    map.putBoolean("focused", node.optBoolean("focused"))
                    map.putBoolean("scrollable", node.optBoolean("scrollable"))
                    map.putArray("children", Arguments.createArray())
                    nodes.pushMap(map)
                }
            }
            result.putArray("nodes", nodes)
            result
        }.onSuccess(promise::resolve).onFailure { promise.reject("VISION_SNAPSHOT", it.message, it) }
    }

    @ReactMethod
    fun requestAccessibilitySettings(promise: Promise) {
        runCatching {
            context.startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
            Unit
        }.onSuccess(promise::resolve).onFailure { promise.reject("VISION_ACCESSIBILITY_SETTINGS", it.message, it) }
    }

    @ReactMethod
    fun getState(promise: Promise) {
        runCatching {
            val prefs = context.getSharedPreferences(PREFS, 0)
            val snapshot = prefs.getString(SNAPSHOT, null)
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
