# Secure / Biometric Vault native migration

## Stage 1 target
Keep the React Native UI and platform-neutral vault repository contracts, but move security-sensitive primitives behind native-backed implementations.

### Android
- Android Keystore is the root of trust for the vault master key.
- Android BiometricPrompt is the authentication boundary.
- AES-256-GCM is used for vault payload encryption.
- Screen protection uses Android FLAG_SECURE semantics.
- The JS layer must not persist a raw master key in ordinary storage.

### iOS
- Keep the same TypeScript contracts.
- Implement the native security adapter with Keychain/Secure Enclave where supported and LocalAuthentication.
- The UI and data model remain shared.

### Migration rule
Do not rewrite the whole app for Android. Only platform-sensitive adapters should be replaced with native implementations. Shared TypeScript UI, validation, models and business logic can remain cross-platform.
