# Android APK and phone-only workflow

Nexus Plus is an Expo Router / React Native application. There is no `MindActivity` or `MainActivity` source in this repository because Expo generates the Android activity entrypoint during native project generation. Adding a standalone Kotlin activity would duplicate the Expo lifecycle and is not required for the current architecture.

## APK

From `artifacts/nexus-plus`:

```bash
pnpm install
pnpm typecheck
pnpm android:apk
```

The `preview` EAS profile is configured to produce an installable Android APK. `production` produces an Android App Bundle.

## Expo Go preview

For the JavaScript/UI preview workflow on an Android phone:

```bash
pnpm install
pnpm dev
```

Use `pnpm dev:tunnel` when the phone and development machine are not on the same local network. Scan the QR code with Expo Go.

Expo Go can preview the React Native UI and navigation, but it cannot provide every native module used by the complete Nexus Plus app. Features such as SecureStore, LocalAuthentication, ScreenCapture, and other native integrations require a development build or EAS APK when they are exercised.

## Current app structure

- Home: clean dashboard with exactly three primary destinations — Book Reader, Media Player, and All Features.
- Features: centralized accessible list of all app features.
- Book Reader: persistent Library, Import New Book, Other Books Control, OCR action, playback controls and Change Voice.
- Voice Library: exposes only downloaded voices to the Reader voice picker.
- Settings remains accessible from the Features list and is not shown as a bottom-navigation tab.
- Theme: all screens use shared semantic tokens from `constants/colors.ts` through `useColors()`, so light/dark appearance is inherited automatically by new features.

## Android entrypoint note

The Android package id remains `com.nexuswavetech.nexusplus`. Native Android files are intentionally not committed as a second, parallel architecture. When EAS or Expo prebuild generates the Android project, the generated activity is the correct entrypoint for this app.
