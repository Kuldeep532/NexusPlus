# Android Native Compatibility Baseline

This app is an Expo/React Native application designed to produce a compiled Android APK/AAB with EAS. Expo Go is not the production runtime requirement.

## Current assessment

### Compatible with compiled Android, with native Expo modules
- Expo Router/navigation
- Camera and image picker
- Document picker / content selection
- Media library
- Notifications
- Local authentication / secure store
- Screen capture protection
- Audio/video playback
- Haptics
- File-system APIs
- PDF native integration where the dependency is available in the generated Android project

### Requires Android-specific hardening
- Biometric Vault / Secure Vault: move master-key lifecycle to Android Keystore + BiometricPrompt-backed native implementation; Expo wrappers remain a JS interface but must not be treated as the security boundary.
- File encryption: handle Android content URIs and persist permissions; do not assume filesystem paths.
- PDF conversion/protection: validate native PDF library ABI and Android API support in EAS build; use content URI input/output.
- Selfie/camera: handle runtime permission denial, activity recreation and camera lifecycle.
- Media player/radio/video: handle audio focus, lifecycle and foreground playback where applicable.
- Battery/time announcers: Android broadcast and background-execution restrictions apply.
- Firebase/Auth: verify native Google Play Services/Firebase configuration in the Android build.
- Alarm: exact Android alarm APIs, boot/timezone rescheduling and full-screen alarm behavior belong in native code.

## Migration rule

A feature is considered Android-ready only after:
1. its dependencies are autolinked/available in an EAS Android build;
2. it uses Android permission/content-URI/lifecycle semantics;
3. it survives process death or activity recreation where the feature requires persistence;
4. security-sensitive operations are backed by Android platform primitives;
5. an actual debug/preview APK can compile successfully.
