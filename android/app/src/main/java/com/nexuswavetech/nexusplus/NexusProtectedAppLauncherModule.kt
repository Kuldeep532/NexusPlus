package com.nexuswavetech.nexusplus

import android.content.Intent
import android.content.pm.PackageManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Reusable Nexus Plus launch guard for external apps.
 * It consults the local Focus Gate without requiring Nexus Launcher to be HOME.
 */
class NexusProtectedAppLauncherModule(
    private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "NexusProtectedAppLauncher"

    @ReactMethod
    fun evaluate(packageName: String, promise: Promise) {
        runCatching {
            val decision = NexusLauncherFocusGate.evaluateInNexusPlus(reactContext, packageName)
            promise.resolve(decisionToMap(decision))
        }.onFailure { error ->
            promise.reject("NEXUS_PROTECTED_APP_EVALUATE", error.message ?: "Unable to evaluate app protection.", null)
        }
    }

    @ReactMethod
    fun open(packageName: String, promise: Promise) {
        runCatching {
            require(packageName.isNotBlank()) { "Package name cannot be blank." }
            val decision = NexusLauncherFocusGate.evaluateInNexusPlus(reactContext, packageName)
            if (decision.blocked) {
                val blocked = decisionToMap(decision)
                blocked.putBoolean("opened", false)
                promise.resolve(blocked)
                return@runCatching
            }

            val intent = reactContext.packageManager.getLaunchIntentForPackage(packageName)
            requireNotNull(intent) { "No launchable activity found for $packageName" }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactContext.startActivity(intent)
            NexusLauncherFocusGate.startProtectedSession(reactContext, packageName)

            val result = decisionToMap(decision)
            result.putBoolean("opened", true)
            promise.resolve(result)
        }.onFailure { error ->
            promise.reject("NEXUS_PROTECTED_APP_OPEN", error.message ?: "Unable to open protected app.", null)
        }
    }

    @ReactMethod
    fun listLaunchableApps(promise: Promise) {
        runCatching {
            val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
            val apps = reactContext.packageManager.queryIntentActivities(intent, PackageManager.MATCH_ALL)
                .mapNotNull { resolveInfo ->
                    val activity = resolveInfo.activityInfo ?: return@mapNotNull null
                    val packageName = activity.packageName
                    if (packageName == reactContext.packageName) return@mapNotNull null
                    val label = resolveInfo.loadLabel(reactContext.packageManager)?.toString()?.trim().orEmpty()
                    if (label.isBlank()) return@mapNotNull null
                    Arguments.createMap().apply {
                        putString("packageName", packageName)
                        putString("label", label)
                    }
                }
                .distinctBy { it.getString("packageName") }
                .sortedBy { it.getString("label")?.lowercase() }

            val result = Arguments.createArray()
            apps.forEach(result::pushMap)
            promise.resolve(result)
        }.onFailure { error ->
            promise.reject("NEXUS_PROTECTED_APP_LIST", error.message ?: "Unable to list apps.", null)
        }
    }

    private fun decisionToMap(decision: NexusLauncherFocusGate.Decision) = Arguments.createMap().apply {
        putBoolean("blocked", decision.blocked)
        putString("label", decision.label)
        putString("message", decision.message)
        putBoolean("canGrantCooldown", decision.canGrantCooldown)
        putInt("remainingMinutes", decision.remainingMinutes)
    }
}
