# Nexus Plus Supabase content control plane

The Android app uses Supabase only as a public content/release read plane.

## Android environment

Configure these Expo public variables at build time:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

The anonymous/publishable key is safe to ship only because RLS permits read-only access to explicitly enabled rows. Never put a service-role key in the Android app.

## Tables

- `app_content` — localized, enabled feature content such as Home labels and privacy-policy sections.
- `remote_agent_releases` — signed/release metadata and HTTPS download links for Windows, macOS and Ubuntu desktop agents.

Run `supabase/migrations/001_app_content.sql` in the intended Supabase project before publishing content.

## Zero-trust rules

Do not store any of the following in these tables:

- Android private signing keys
- Protection Passwords or password hashes
- biometric templates or authentication results
- desktop passwords/PINs
- pairing secrets or session tokens
- raw microphone/screen recordings unless a separate, explicit privacy-reviewed backend is introduced

The Android client performs GET-only requests. Publishing and mutation must happen through the Supabase dashboard or a trusted server using the service-role key.
