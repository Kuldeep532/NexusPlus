# Nexus Plus Supabase content control plane

The Android app uses Supabase only as a public, non-sensitive content/release read plane.

## Android environment

Configure these Expo public variables at build time:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

The publishable/anonymous key is safe to ship only because RLS permits read-only access to explicitly enabled rows. Never put a service-role key in the Android app.

## Tables

- `app_content` — localized, enabled feature content such as Home labels and privacy-policy sections.
- `remote_agent_releases` — desktop-agent release metadata and HTTPS download links for Windows, macOS and Ubuntu.

Run `supabase/migrations/001_app_content.sql` in the intended Supabase project before publishing content.

## Android integration

Remote Computer's Control screen reads the latest enabled desktop-agent release for each supported platform and exposes an accessible download button. Privacy Policy reads the enabled `privacy` content set and falls back to bundled copy if Supabase is unavailable.

The Home registration metadata identifies Computer Control as a first-class `tools` feature and maps it to the `home/remote-computer` content record.

## Zero-trust rules

Do not store any of the following in these tables:

- Android private signing keys
- Protection Passwords or password hashes
- biometric templates or authentication results
- desktop passwords/PINs
- pairing secrets or session tokens
- raw microphone/screen recordings unless a separate, explicit privacy-reviewed backend is introduced

The Android client performs GET-only requests. Publishing and mutation must happen through the Supabase dashboard or a trusted server using the service-role key.
