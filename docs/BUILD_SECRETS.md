# Mobile CD build secrets

The manual mobile workflow is GitHub-hosted and performs native Android compilation directly, so Android APK/AAB builds do not consume an EAS cloud build-time limit.

EAS Build remains separately available for Expo cloud builds using the project's `preview` and `production` profiles.

## One-copy secret setup

Use `docs/STORE_BUILD_SECRETS.template.env` as the single source-of-truth template. Fill the values locally and create GitHub Actions secrets with the exact names. Never commit the filled file.

Firebase Android configuration is consolidated into **one secret**: `FIREBASE_GOOGLE_SERVICES_JSON_BASE64`. It is decoded only inside the Android runner into a temporary `android/app/google-services.json` and deleted after the build.

## Android outputs

The manual workflow supports:

- Android APK
- Android AAB
- both in one run (`all`)

## Android signing

Release signing is performed only at runner runtime:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_PASSWORD`

The workflow decodes the existing keystore into the runner's temporary directory, writes `android/key.properties` only for the build, signs the release APK/AAB through Gradle, and deletes both the keystore and `key.properties` in an `always()` cleanup step.

No keystore, alias, password, or other signing credential is committed to the repository.

For EAS cloud builds, the `eas.json` profiles use EAS-managed (`remote`) Android credentials. Configure the same existing Android signing credential in EAS once with `eas credentials --platform android`; EAS stores and uses it remotely. The GitHub runner does not upload the private keystore to EAS as part of the native CD build.

## GitHub Actions vs EAS

Use **GitHub Actions** when you need a native Android build that is independent of an EAS cloud build-time limit.

Use **EAS Build** when you want Expo's cloud build service, for example:

```bash
eas build --platform android --profile preview
eas build --platform android --profile production
```

The `preview` profile generates an APK for internal distribution; the `production` profile generates an AAB suitable for Google Play. EAS uses the credentials configured for the selected profile.

## EAS project/authentication

- `EXPO_TOKEN` is used for non-interactive authenticated Expo CLI operations where needed.
- `EAS_PROJECT_ID` identifies the linked EAS project for CI/project operations.

These are not required by the native GitHub Android build itself.

## Runtime client configuration

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

## Google Play Store

- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64`
- `GOOGLE_PLAY_PACKAGE_NAME`

The Google Play service-account key is for trusted CI/EAS submission operations and must never be bundled into the mobile application.

## Apple / App Store

- `ASC_API_KEY_P8_BASE64`
- `ASC_KEY_ID`
- `ASC_ISSUER_ID`
- `APPLE_TEAM_ID`
- `APPLE_BUNDLE_ID`
- `IOS_DISTRIBUTION_CERT_P12_BASE64`
- `IOS_DISTRIBUTION_CERT_PASSWORD`
- `IOS_PROVISIONING_PROFILE_BASE64`

## Manual-only policy

The native mobile CD workflow is intentionally manual-only. It does not run on push, pull request, schedule, or release events.

## Firebase notifications and Supabase remote config

The app obtains native FCM tokens and stores authenticated tokens in Supabase `push_tokens`. FCM HTTP v1 sending must run from a trusted server/CI environment.

The app polls Supabase `remote_config` every 60 seconds and supports `top_banner`, `dialog`, `feature_flag`, and JSON `content`. Apply `supabase/migrations/20260827113000_remote_config_and_push_tokens.sql` once to the Supabase project.
