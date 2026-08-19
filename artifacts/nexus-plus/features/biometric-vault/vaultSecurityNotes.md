# Nexus Biometric Vault security model

- Vault records are encrypted as a single authenticated AES-256-GCM payload.
- The AES key is generated locally and stored behind Expo SecureStore authentication.
- SecureStore uses `WHEN_UNLOCKED_THIS_DEVICE_ONLY` for the master key so it is not migrated through device restore.
- Biometric authentication is required before opening the vault, and Android is restricted to strong biometrics where supported.
- Sensitive screens use Expo ScreenCapture protection to block screenshots/recording and protect app-switcher previews.
- The React state holding decrypted vault records is cleared whenever the vault locks or the app leaves the foreground.
- Auto-lock is enabled by default at 60 seconds.
- AAD binds encrypted records to the Nexus vault format, key version, and Android application ID.
- Clipboard handling for sensitive values is isolated in `clipboardProtection.ts` and supports timed clearing.
- No vault records are written to AsyncStorage, logs, or ordinary files by the feature.

Important limitation: JavaScript memory is not a hardware-isolated secret container. The strongest protection available to this Expo architecture is to keep the long-lived key in SecureStore, require authentication to retrieve it, encrypt all persistent records with AES-GCM, and minimize the lifetime of decrypted records in JS memory.
