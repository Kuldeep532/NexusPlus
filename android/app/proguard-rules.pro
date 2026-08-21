# Keep React Native bridge modules/packages that are instantiated by name or
# discovered through ReactPackage. The Android host registers these packages
# explicitly, but their @ReactMethod entry points must remain callable after R8.
-keep class com.nexuswavetech.nexusplus.NexusVaultModule { *; }
-keep class com.nexuswavetech.nexusplus.NexusVaultPackage { *; }
-keep class com.nexuswavetech.nexusplus.NexusMediaModule { *; }
-keep class com.nexuswavetech.nexusplus.NexusMediaPackage { *; }
-keep class com.nexuswavetech.nexusplus.NexusFileUriModule { *; }
-keep class com.nexuswavetech.nexusplus.NexusFileUriPackage { *; }
-keep class com.nexuswavetech.nexusplus.NexusDocumentReaderModule { *; }
-keep class com.nexuswavetech.nexusplus.NexusDocumentReaderPackage { *; }

# JNI methods are looked up by their generated Java/Kotlin class and exact
# native method names. Prevent shrinking/renaming of the encryption bridge.
-keep class com.nexuswavetech.nexusplus.encryption.FileEncryptionNative { *; }

# Keep the native methods referenced from JNI symbol names.
-keepclasseswithmembernames,includedescriptorclasses class * {
    native <methods>;
}

# Preserve Android components referenced from the manifest and intent system.
-keep class com.nexuswavetech.nexusplus.MainActivity { *; }
-keep class com.nexuswavetech.nexusplus.AlarmReceiver { *; }
-keep class com.nexuswavetech.nexusplus.AlarmRingActivity { *; }
-keep class com.nexuswavetech.nexusplus.BootReceiver { *; }
-keep class com.nexuswavetech.nexusplus.NexusMediaPlaybackService { *; }

# Keep the custom Application entry point used by the checked-in Android host.
-keep class com.nexuswavetech.nexusplus.NexusReactApplication { *; }
