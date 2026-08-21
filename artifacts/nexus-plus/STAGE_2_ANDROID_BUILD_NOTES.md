# Stage 2 — Android build boundary

The application UI/runtime remains Expo Router + React Native 0.81.5. The `android/` project is the native host and contains Nexus Plus native modules (Vault, PDF, file URI, media, video, vocal remover, document reader, system settings, alarm).

Do not replace the generated Expo `MainActivity`/`MainApplication` with a standalone AppCompat-only application. EAS prebuild remains the authoritative native-project generator until the React Native host is fully generated and checked into the repository.

Direct GitHub Actions APK builds are allowed once the generated Android project is present and the native modules are registered by the config plugin. EAS is retained as a fallback and for validating prebuild compatibility.
