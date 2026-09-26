package com.nexuswavetech.nexusplus

import android.app.Application
import android.content.res.Configuration
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper

class NexusReactApplication : Application(), ReactApplication {
    override val reactNativeHost: ReactNativeHost =
        ReactNativeHostWrapper(this, object : DefaultReactNativeHost(this) {
            override fun getPackages(): List<ReactPackage> =
                PackageList(this).packages.toMutableList().apply {
                    add(NexusAssistantVoicePackage())
                    add(NexusNativeSecurityPackage())
                    add(NexusIntegrityPackage())
                    add(NexusAlarmPackage())
                    add(NexusAuthPackage())
                    add(NexusVaultPackage())
                    add(NexusDocumentReaderPackage())
                    add(NexusMediaPackage())
                    add(NexusMusicPackage())
                    add(NexusFileUriPackage())
                    add(NexusCctvDiscoveryPackage())
                    add(NexusCctvOnvifPackage())
                    add(NexusPdfNativePackage())
                    add(NexusVisionAssistPackage())
                    // Remote control is intentionally retained.
                    add(NexusRemotePackage())
                    add(NexusRemoteDiscoveryPackage())
                    add(NexusTvCastPackage())
                    add(NexusTvRemotePackage())
                    // Translation is retained because it is an exposed app capability.
                    add(NexusTranslationPackage())
                }

            override fun getJSMainModuleName(): String = ".expo/.virtual-metro-entry"
            override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG
            override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
            override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
        })

    override val reactHost: ReactHost
        get() = ReactNativeHostWrapper.createReactHost(applicationContext, reactNativeHost)

    override fun onCreate() {
        super.onCreate()
        SoLoader.init(this, OpenSourceMergedSoMapping)
        runCatching {
            ApplicationLifecycleDispatcher.onApplicationCreate(this)
        }
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        runCatching {
            ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
        }
    }
}
