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

The PDF to Images feature uses native Android PDF rendering and native ZIP creation. It therefore requires an Expo Development Build or EAS APK; it is not an Expo Go-only feature. The feature renders selected PDF pages locally, supports PNG or JPG output, accepts 72–600 DPI, creates one ZIP archive, and exposes the generated ZIP through the Android share sheet.

For a clean native rebuild after dependency changes, use the EAS build command above or run Expo prebuild before a local Android build.

## Expo Go preview

For the JavaScript/UI preview workflow on an Android phone:

```bash
pnpm install
pnpm dev
```

Use `pnpm dev:tunnel` when the phone and development machine are not on the same local network. Scan the QR code with Expo Go.

Expo Go can preview the React Native UI and navigation, but it cannot provide every native module used by the complete Nexus Plus app. Features such as SecureStore, LocalAuthentication, ScreenCapture, PDF rendering, ZIP export, and other native integrations require a development build or EAS APK when they are exercised.

## Current app structure

- Home: clean dashboard with feature names only; feature descriptions have been removed from the home feature cards.
- Features: centralized accessible list of all app features.
- Book Reader: persistent Library, Import New Book, Other Books Control, OCR action, playback controls and Change Voice.
- Voice Library: moved into Settings and exposes only downloaded voices to the Reader voice picker.
- Settings: contains Voice Library, Privacy Policy, Terms and Conditions, and About Us.
- Theme: all screens use shared semantic tokens from `constants/colors.ts` through `useColors()`, so light/dark appearance is inherited automatically by new features.

## Android entrypoint note

The Android package id remains `com.nexuswavetech.nexusplus`. Native Android files are intentionally not committed as a second, parallel architecture. When EAS or Expo prebuild generates the Android project, the generated activity is the correct entrypoint for this app.
