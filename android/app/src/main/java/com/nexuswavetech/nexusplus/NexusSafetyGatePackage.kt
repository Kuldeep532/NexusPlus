package com.nexuswavetech.nexusplus

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.ViewManager

class NexusSafetyGateModule(
    private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "NexusSafetyGate"

    @ReactMethod
    fun getState(promise: Promise) {
        runCatching {
            val map = Arguments.createMap()
            map.putBoolean("acknowledged", NexusSafetyGate.isAcknowledged(reactContext))
            map.putBoolean("accessibilityEnabled", NexusSafetyGate.isSafetyAccessibilityEnabled(reactContext))
            map.putBoolean("ready", NexusSafetyGate.isReady(reactContext))
            promise.resolve(map)
        }.onFailure { error ->
            promise.reject("SAFETY_STATE", error.message ?: "Unable to read safety state.", null)
        }
    }

    @ReactMethod
    fun acknowledge(promise: Promise) {
        runCatching {
            NexusSafetyGate.acknowledge(reactContext)
            promise.resolve(true)
        }.onFailure { error ->
            promise.reject("SAFETY_ACK", error.message ?: "Unable to save safety agreement.", null)
        }
    }

    @ReactMethod
    fun openAccessibilitySettings(promise: Promise) {
        runCatching {
            NexusSafetyGate.openAccessibilitySettings(reactContext)
            promise.resolve(true)
        }.onFailure { error ->
            promise.reject("SAFETY_SETTINGS", error.message ?: "Unable to open Accessibility Settings.", null)
        }
    }
}

class NexusSafetyGatePackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
        listOf(NexusSafetyGateModule(reactContext))

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
