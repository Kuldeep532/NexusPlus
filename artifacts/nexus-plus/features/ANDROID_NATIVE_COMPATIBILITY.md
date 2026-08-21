# Android Native Compatibility Audit

Repository: NexusPlus
Target: compiled Android application / EAS fast build

## Findings

- The real application is under `artifacts/nexus-plus` and is a React Native + Expo project.
- The project is buildable as a native Android app only when Expo modules are available through the generated native Android project.
- Security-sensitive Biometric Vault code currently depends directly on `expo-local-authentication`, `expo-secure-store`, `expo-screen-capture`, and `expo-crypto`.
- These APIs are Android-capable Expo modules, but they are not equivalent to removing the JS/native boundary. For the production vault, Android Keystore + BiometricPrompt backed implementations should own the master-key lifecycle.
- Any feature using file URIs, media capture, background execution, notifications, exact alarms, clipboard, screen capture, or filesystem access must use Android permission-aware APIs and content URIs instead of assuming a browser filesystem.

## Feature migration order

1. Biometric Vault / Secure Vault: Android Keystore + BiometricPrompt + encrypted persistence.
2. File Encryption: Storage Access Framework/content URI handling and native crypto stream support.
3. PDF Native / Protect PDF: Android document providers/content URIs and native rendering/encryption.
4. Selfie / camera tools: Camera permission + Android lifecycle/background handling.
5. Media player / radio / video tools: Android media session/audio-focus and foreground playback where required.
6. Battery/time announcers: Android broadcast/lifecycle constraints and notification/audio behavior.
7. Auth/Firebase: Android-native configuration, Google Sign-In/Play Services integration, secure token storage.
8. Remaining modules: storage, permissions, background work, lifecycle and accessibility audit.

## Rule

Do not mark a feature Android-compatible merely because React Native can render its screen. Every feature must survive a compiled APK/AAB lifecycle, Android permissions, activity recreation, process death, configuration changes, and device storage rules.
