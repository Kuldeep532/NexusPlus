# Nexus Plus release R8/ProGuard hardening.
# Keep only entry points that are required by Android, JNI, or React Native.
# Do not keep whole application packages: that would defeat shrinking/obfuscation.

-keepclasseswithmembernames,includedescriptorclasses class * {
    native <methods>;
}

# React Native packages registered explicitly by NexusReactApplication.
-keep class com.nexuswavetech.nexusplus.NexusVaultModule { *; }
-keep class com.nexuswavetech.nexusplus.NexusVaultPackage { *; }
-keep class com.nexuswavetech.nexusplus.NexusMediaModule { *; }
-keep class com.nexuswavetech.nexusplus.NexusMediaPackage { *; }
-keep class com.nexuswavetech.nexusplus.NexusFileUriModule { *; }
-keep class com.nexuswavetech.nexusplus.NexusFileUriPackage { *; }
-keep class com.nexuswavetech.nexusplus.NexusDocumentReaderModule { *; }
-keep class com.nexuswavetech.nexusplus.NexusDocumentReaderPackage { *; }
-keep class com.nexuswavetech.nexusplus.NexusLauncherFocusGateModule { *; }
-keep class com.nexuswavetech.nexusplus.NexusLauncherFocusGatePackage { *; }
-keep class com.nexuswavetech.nexusplus.NexusProtectedAppLauncherModule { *; }
-keep class com.nexuswavetech.nexusplus.NexusProtectedAppLauncherPackage { *; }
-keep class com.nexuswavetech.nexusplus.NexusNativeSecurityModule { *; }
-keep class com.nexuswavetech.nexusplus.NexusNativeSecurityPackage { *; }

# Android manifest components and the custom Application entry point.
-keep class com.nexuswavetech.nexusplus.MainActivity { *; }
-keep class com.nexuswavetech.nexusplus.NexusReactApplication { *; }
-keep class com.nexuswavetech.nexusplus.AlarmReceiver { *; }
-keep class com.nexuswavetech.nexusplus.AlarmRingActivity { *; }
-keep class com.nexuswavetech.nexusplus.BootReceiver { *; }
-keep class com.nexuswavetech.nexusplus.NexusMediaPlaybackService { *; }
-keep class com.nexuswavetech.nexusplus.NexusLauncherActivity { *; }
-keep class com.nexuswavetech.nexusplus.NexusLauncherSettingsActivity { *; }
-keep class com.nexuswavetech.nexusplus.NexusLauncherMentorActivity { *; }

# Native encryption bridge.
-keep class com.nexuswavetech.nexusplus.encryption.FileEncryptionNative { *; }

# PDFBox optional classes.
-dontwarn com.gemalto.jp2.JP2Decoder
-dontwarn com.gemalto.jp2.JP2Encoder

-keepattributes RuntimeVisibleAnnotations,RuntimeInvisibleAnnotations,RuntimeVisibleParameterAnnotations,RuntimeInvisibleParameterAnnotations,AnnotationDefault,Signature,InnerClasses,EnclosingMethod

-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
}
