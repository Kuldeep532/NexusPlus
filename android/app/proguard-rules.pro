# Nexus Plus release R8/ProGuard hardening.
# Keep only entry points that are required by Android, JNI, or React Native.
# Do not keep whole application packages: that would defeat shrinking/obfuscation.

# React Native native methods/JNI entry points.
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

# Android manifest components and the custom Application entry point.
-keep class com.nexuswavetech.nexusplus.MainActivity { *; }
-keep class com.nexuswavetech.nexusplus.NexusReactApplication { *; }
-keep class com.nexuswavetech.nexusplus.AlarmReceiver { *; }
-keep class com.nexuswavetech.nexusplus.AlarmRingActivity { *; }
-keep class com.nexuswavetech.nexusplus.BootReceiver { *; }
-keep class com.nexuswavetech.nexusplus.NexusMediaPlaybackService { *; }

# Native encryption bridge: preserve the Java/Kotlin declaration used to bind
# JNI. The implementation itself stays in C++ and is protected by native
# symbol visibility settings in CMake.
-keep class com.nexuswavetech.nexusplus.encryption.FileEncryptionNative { *; }

# Keep JSON/serialization annotations when libraries discover fields/methods
# reflectively, without disabling obfuscation globally.
-keepattributes RuntimeVisibleAnnotations,RuntimeInvisibleAnnotations,RuntimeVisibleParameterAnnotations,RuntimeInvisibleParameterAnnotations,AnnotationDefault,Signature,InnerClasses,EnclosingMethod

# Never ship debug logging from release builds where R8 can remove it safely.
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
}
