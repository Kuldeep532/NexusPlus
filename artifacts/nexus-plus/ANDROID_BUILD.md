# Android APK build

This Expo application is configured for Android APK builds with EAS.

From `artifacts/nexus-plus`:

```bash
pnpm install
pnpm typecheck
pnpm android:apk
```

The `preview` EAS profile produces an installable Android APK. The `production` profile is configured for an Android App Bundle.

For a fully local native Android build, generate the native project with Expo prebuild/dev-build tooling and build it with Gradle. Because this app uses native Expo modules such as SecureStore, LocalAuthentication, ScreenCapture, Audio, Video and MediaLibrary, a plain Expo Go runtime is not the target for the complete feature set.

## Current navigation

- Home: clean dashboard with primary app actions and recent content.
- Features: centralized list containing Book Reader, Nexus Media, Biometric Vault, Voice Library, Settings and About.
- Settings is intentionally removed from the visible bottom navigation and remains reachable from Features.

## Build prerequisites

- Node.js compatible with the repository's Expo SDK.
- pnpm.
- An Expo/EAS account for cloud APK builds.
- Android signing credentials for release distribution.
