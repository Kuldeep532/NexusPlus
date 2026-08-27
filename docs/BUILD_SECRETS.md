# Mobile CD build secrets

The manual mobile workflow is GitHub-hosted and does **not** invoke an EAS cloud build for native compilation. This avoids consuming an Expo/EAS build-time limit for Android/iOS compilation.

## One-copy secret setup

Use `docs/STORE_BUILD_SECRETS.template.env` as the single source-of-truth template. Fill the values locally and create GitHub Actions secrets with the exact names. Never commit the filled file.

Firebase Android configuration is consolidated into **one secret**: `FIREBASE_GOOGLE_SERVICES_JSON_BASE64`. It is decoded only inside the Android runner into a temporary `android/app/google-services.json` and deleted after the build.

## Android outputs

The manual workflow supports:

- Android APK
- Android AAB
- both in one run (`all`)

Android signing values are stored in GitHub Secrets. Google Play service-account JSON is also represented as one base64 secret (`GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64`) for future/manual Play upload steps.

## iOS output

The manual workflow uses a macOS GitHub-hosted runner and produces an iOS `.xcarchive`. Apple distribution credentials are represented as single-secret values in the template. The workflow deliberately does not auto-submit anything.

## Manual-only policy

There are no push, pull_request, schedule, or release triggers for the mobile CD workflow. A build starts only from **Actions → Manual Mobile Build → Run workflow**.

## Secrets

### Runtime client configuration

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_MEASUREMENT_ID` (optional)
- `FIREBASE_GOOGLE_SERVICES_JSON_BASE64`

### Android / store

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_PASSWORD`
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64`
- `GOOGLE_PLAY_PACKAGE_NAME`

### Apple / store

- `ASC_API_KEY_P8_BASE64`
- `ASC_KEY_ID`
- `ASC_ISSUER_ID`
- `APPLE_TEAM_ID`
- `APPLE_BUNDLE_ID`
- `IOS_DISTRIBUTION_CERT_P12_BASE64`
- `IOS_DISTRIBUTION_CERT_PASSWORD`
- `IOS_PROVISIONING_PROFILE_BASE64`

`EXPO_TOKEN` and `EAS_PROJECT_ID` may still be needed for Expo project operations, but this native CD workflow does not call EAS Build.

Firebase service-account private keys must never be bundled into the mobile application.

## Firebase notifications and Supabase remote config

The app obtains native FCM tokens and stores authenticated tokens in Supabase `push_tokens`. FCM HTTP v1 sending must run from a trusted server/CI environment.

The app polls Supabase `remote_config` every 60 seconds and supports `top_banner`, `dialog`, `feature_flag`, and JSON `content`. Apply `supabase/migrations/20260827113000_remote_config_and_push_tokens.sql` once to the Supabase project.
