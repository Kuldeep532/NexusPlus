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
 * Expo/EAS remains the generated-project fallback; this host also registers
 * every checked-in native bridge explicitly so feature modules are available
 * at runtime instead of relying on implicit discovery.
 */
class NexusReactApplication : Application(), ReactApplication {
    private val reactNativeHost = object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            listOf(
                NexusVaultPackage(),
                NexusMediaPackage(),
                NexusFileUriPackage(),
                NexusDocumentReaderPackage(),
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
