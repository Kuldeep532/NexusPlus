# Nexus Plus release R8/ProGuard hardening.
# Keep only actual Android/JNI/React Native entry points.

-keepclasseswithmembernames,includedescriptorclasses class * {
    native <methods>;
}

# React Native runtime classes are loaded/reflected by the bridge.
# Keep the base runtime intact while allowing unrelated app code to shrink.
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.modules.core.** { *; }
-keep class com.facebook.react.modules.deviceinfo.** { *; }
-keep class com.facebook.react.modules.systeminfo.** { *; }
-keep class com.facebook.react.devsupport.** { *; }
-keep class com.facebook.react.uimanager.** { *; }
-keep class com.facebook.react.common.** { *; }
-keep class com.facebook.hermes.** { *; }

# Android framework / manifest entry points.
-keep class com.nexuswavetech.nexusplus.MainActivity { *; }
-keep class com.nexuswavetech.nexusplus.NexusReactApplication { *; }
-keep class com.nexuswavetech.nexusplus.AlarmReceiver { *; }
-keep class com.nexuswavetech.nexusplus.AlarmRingActivity { *; }
-keep class com.nexuswavetech.nexusplus.BootReceiver { *; }
-keep class com.nexuswavetech.nexusplus.NexusMediaPlaybackService { *; }
-keep class com.nexuswavetech.nexusplus.NexusVisionAccessibilityService { *; }

# Explicit React Native native-module entry points.
-keep class com.nexuswavetech.nexusplus.NexusVaultModule { *; }
-keep class com.nexuswavetech.nexusplus.NexusMediaModule { *; }
-keep class com.nexuswavetech.nexusplus.NexusFileUriModule { *; }
-keep class com.nexuswavetech.nexusplus.NexusDocumentReaderModule { *; }
-keep class com.nexuswavetech.nexusplus.NexusNativeSecurityModule { *; }
-keep class com.nexuswavetech.nexusplus.NexusCctvDiscoveryModule { *; }
-keep class com.nexuswavetech.nexusplus.NexusCctvOnvifModule { *; }
-keep class com.nexuswavetech.nexusplus.NexusPdfNativeModule { *; }
-keep class com.nexuswavetech.nexusplus.NexusRemoteModule { *; }
-keep class com.nexuswavetech.nexusplus.NexusRemoteDiscoveryModule { *; }
-keep class com.nexuswavetech.nexusplus.NexusTvCastModule { *; }
-keep class com.nexuswavetech.nexusplus.NexusTvRemoteModule { *; }
-keep class com.nexuswavetech.nexusplus.NexusTranslationModule { *; }
-keep class com.nexuswavetech.nexusplus.NexusAssistantVoiceModule { *; }
-keep class com.nexuswavetech.nexusplus.NexusIntegrityModule { *; }
-keep class com.nexuswavetech.nexusplus.NexusAuthModule { *; }
-keep class com.nexuswavetech.nexusplus.NexusAlarmModule { *; }
-keep class com.nexuswavetech.nexusplus.encryption.FileEncryptionNative { *; }

# Keep annotations needed by React Native reflection/JNI.
-keepattributes RuntimeVisibleAnnotations,RuntimeInvisibleAnnotations,RuntimeVisibleParameterAnnotations,RuntimeInvisibleParameterAnnotations,AnnotationDefault,Signature,InnerClasses,EnclosingMethod

-dontwarn com.gemalto.jp2.JP2Decoder
-dontwarn com.gemalto.jp2.JP2Encoder

# Debug/verbose logging is removed from release bytecode.
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
}
