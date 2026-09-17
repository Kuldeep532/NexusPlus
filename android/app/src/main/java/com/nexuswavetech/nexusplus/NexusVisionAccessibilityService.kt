package com.nexuswavetech.nexusplus

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityNodeInfo
import android.view.accessibility.AccessibilityEvent
import org.json.JSONArray
import org.json.JSONObject

/**
 * Vision Assist transport. It captures only currently exposed accessibility
 * semantics. Password fields are always redacted and raw key/clipboard data
 * is never collected.
 */
class NexusVisionAccessibilityService : AccessibilityService() {
    companion object {
        @Volatile var instance: NexusVisionAccessibilityService? = null
        private const val PREFS = "nexus_vision_assist"
        private const val SNAPSHOT = "accessibility_snapshot"
        private const val MAX_NODES = 500
        private const val MAX_TEXT = 500
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        refreshSnapshot()
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        refreshSnapshot(event?.source ?: rootInActiveWindow)
    }

    override fun onInterrupt() = Unit

    override fun onDestroy() {
        if (instance === this) instance = null
        super.onDestroy()
    }

    fun refreshSnapshot(source: AccessibilityNodeInfo? = rootInActiveWindow) {
        publishSnapshot(source)
    }

    private fun publishSnapshot(root: AccessibilityNodeInfo?) {
        if (root == null) return
        val snapshot = JSONObject()
            .put("packageName", root.packageName?.toString().orEmpty())
            .put("className", root.className?.toString().orEmpty())
            .put("windowId", root.windowId)
            .put("nodes", JSONArray())
        val nodes = snapshot.getJSONArray("nodes")
        appendNode(root, nodes, 0)
        getSharedPreferences(PREFS, MODE_PRIVATE).edit()
            .putString(SNAPSHOT, snapshot.toString())
            .putLong("updatedAt", System.currentTimeMillis())
            .apply()
    }

    private fun appendNode(node: AccessibilityNodeInfo, out: JSONArray, depth: Int) {
        if (out.length() >= MAX_NODES || depth > 30) return
        val passwordField = node.isPassword
        val item = JSONObject()
            .put("className", node.className?.toString().orEmpty())
            .put("text", if (passwordField) "" else node.text?.toString()?.take(MAX_TEXT).orEmpty())
            .put("contentDescription", if (passwordField) "" else node.contentDescription?.toString()?.take(MAX_TEXT).orEmpty())
            .put("viewId", node.viewIdResourceName?.take(MAX_TEXT).orEmpty())
            .put("clickable", node.isClickable)
            .put("focusable", node.isFocusable)
            .put("focused", node.isFocused)
            .put("enabled", node.isEnabled)
            .put("editable", node.isEditable)
            .put("password", passwordField)
            .put("scrollable", node.isScrollable)
        out.put(item)
        for (index in 0 until node.childCount) {
            if (out.length() >= MAX_NODES) break
            node.getChild(index)?.let { child ->
                appendNode(child, out, depth + 1)
                child.recycle()
            }
        }
    }
}
