# NexusPlus integrity security

## What is protected

The release build generates SHA-256 hashes for selected high-value application files and writes them to `security/integrity-manifest.json`.

The manifest itself is not treated as a secret. It is an integrity reference. Production authenticity must be established by signing the release artifact and, on Android, validating Play Integrity on the trusted backend.

## Runtime policy

1. Verify the expected manifest/version at startup.
2. Verify protected assets before high-value actions such as voice downloads.
3. On mismatch, fail closed for the protected action and emit a minimal security event.
4. Never upload file contents, raw secrets, or a full device fingerprint as part of an integrity event.

## Build-time generation

Run `node security/generate-integrity-manifest.js` during the release build after source compilation/transformation inputs are finalized.

Do not hash the manifest itself as one of its own protected files; that would create a self-referential hash.

## Android hardening

For production distribution, use Play Integrity from the native Android layer and evaluate the verdict on a trusted backend. Do not embed a backend secret in JavaScript, Kotlin, C++, or the APK. See the Android developer documentation for Play Integrity and native integration.

## Important limitation

Client-side integrity checks can be bypassed on a compromised/rooted device. They are a tamper signal, not an unbreakable security boundary.
