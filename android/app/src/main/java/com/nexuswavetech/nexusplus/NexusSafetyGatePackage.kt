package com.nexuswavetech.nexusplus

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.ViewManager

class NexusSafetyGateModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "NexusSafetyGate"

    @ReactMethod fun getState(promise: Promise) {
        runCatching {
            Arguments.createMap().apply {
                putBoolean("acknowledged", NexusSafetyGate.isAcknowledged(reactContext))
                putBoolean("accessibilityEnabled", NexusSafetyGate.isSafetyAccessibilityEnabled(reactContext))
                putBoolean("ready", NexusSafetyGate.isReady(reactContext))
            }.also(promise::resolve)
        }.onFailure { promise.reject("SAFETY_STATE", it.message ?: "Unable to read safety state") }
    }

    @ReactMethod fun acknowledge(promise: Promise) {
        runCatching { NexusSafetyGate.acknowledge(reactContext); promise.resolve(true) }
            .onFailure { promise.reject("SAFETY_ACK", it.message ?: "Unable to save safety agreement") }
    }

    @ReactMethod fun openAccessibilitySettings(promise: Promise) {
        runCatching { NexusSafetyGate.openAccessibilitySettings(reactContext); promise.resolve(true) }
            .onFailure { promise.reject("SAFETY_SETTINGS", it.message ?: "Unable to open Accessibility Settings") }
    }
}

class NexusSafetyGatePackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> = listOf(NexusSafetyGateModule(reactContext))
    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
