# Android build

Nexus Plus is an Expo Router application configured for the New Architecture.

## APK

Install dependencies from the workspace root, then run:

```bash
pnpm --filter @workspace/nexus-plus install
pnpm --filter @workspace/nexus-plus typecheck
pnpm --filter @workspace/nexus-plus android:apk
```

## Native PDF export

The PDF to Images feature uses native Android PDF rendering and native ZIP creation. It therefore requires an Expo Development Build or EAS APK; it is not an Expo Go-only feature.

The feature renders selected PDF pages locally, supports PNG or JPG output, accepts 72–600 DPI, creates one ZIP archive, and exposes the generated ZIP through the Android share sheet.

For a clean native rebuild after dependency changes, use the EAS build command above or run Expo prebuild before a local Android build.
