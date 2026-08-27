# Android build secrets

The Android workflows expect these GitHub Actions secrets. Do not commit `.env` files or `google-services.json`.

## Supabase

- `SUPABASE_URL` — hosted Supabase project URL.
- `SUPABASE_ANON_KEY` — Supabase publishable/anon client key.

## Firebase client configuration

- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_MEASUREMENT_ID` — optional.
- `FIREBASE_GOOGLE_SERVICES_JSON_BASE64` — base64-encoded `google-services.json` for Android FCM.

## Existing Android/EAS secrets

- `EXPO_TOKEN`
- `EAS_PROJECT_ID`
- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_PASSWORD`

The manual EAS workflow copies the GitHub values into the matching EAS `preview` or `production` environment before the build. The `GOOGLE_SERVICES_JSON` EAS variable is a secret file variable. Client-side `EXPO_PUBLIC_*` values are embedded in the application bundle, so they must be treated as public at runtime even when stored as GitHub/EAS secrets.

## Firebase notification flow

The app uses `expo-notifications` to obtain the native Android FCM token and stores that token in the Supabase `push_tokens` table for the authenticated user. FCM HTTP v1 sending must happen from a trusted server or CI environment using a Firebase service-account credential; never put a Firebase service-account private key in the Android app.

## Supabase remote configuration

Apply `supabase/migrations/20260827113000_remote_config_and_push_tokens.sql` to the Supabase project. The app polls `remote_config` every 60 seconds and currently supports:

- `top_banner` — a message bar across the app.
- `dialog` — a remotely controlled modal dialog.
- `feature_flag` — generic remote values available through the remote-config client.
- `content` — generic JSON content for future feature integrations.

Use `payload.value` for a simple feature value, or store richer JSON in `payload` for feature-specific configuration. `starts_at` and `ends_at` allow scheduled changes without a new app build.
