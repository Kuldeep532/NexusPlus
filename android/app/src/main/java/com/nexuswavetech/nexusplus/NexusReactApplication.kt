package com.nexuswavetech.nexusplus

import android.app.Application
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader

/**
 * Minimal React Native host used by direct Gradle/GitHub Actions builds.
 * Only native bridges that are present in this checked-in Android module are
 * registered here; Expo/EAS can continue to supply generated integrations.
 */
class NexusReactApplication : Application(), ReactApplication {
    private val reactNativeHost = object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            listOf(
                NexusVaultPackage(),
                NexusMediaPackage(),
                NexusFileUriPackage(),
                NexusDocumentReaderPackage(),
                NexusAlarmPackage(),
                NexusIntegrityPackage(),
            )

        override fun getJSMainModuleName(): String = "expo-router/entry"
        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG
        override val isNewArchEnabled: Boolean = true
        override val isHermesEnabled: Boolean = true
    }

    override fun getReactNativeHost(): ReactNativeHost = reactNativeHost

    override fun onCreate() {
        super.onCreate()
        SoLoader.init(this, false)
        if (BuildConfig.DEBUG) load()
    }
}
