# Remote Computer Access — Stages 1–6

Android-first remote computer access for a paired Windows, Ubuntu/Linux, or macOS desktop agent.

## Stage 6 Android security flow

1. A first-time user cannot activate Remote Computer until a desktop agent is reachable.
2. Android requests a pairing challenge from the desktop agent.
3. The agent presents a short-lived pairing code; the user confirms the same code on the desktop.
4. Android uses its device-bound Android Keystore signing identity.
5. After pairing, the user creates a local **Protection Password** of at least 8 characters.
6. Only a salted SHA-256 password verifier is stored in Android SecureStore; the password is never sent to the desktop.
7. Five failed password attempts trigger a short lockout.
8. The paired computer identity and agent endpoint are stored in SecureStore.
9. Remote control screens require an unlocked Protection Password session.
10. Protected remote commands still require their existing fresh challenge and Android Keystore user-authenticated signature.

## Native Android boundary

`NexusRemoteKeyModule` is the native signing authority. Its private key remains in Android Keystore and the JavaScript layer only receives the public key or a signature. The native key is configured for user authentication on every signature use.

## Important limitation

The Protection Password is an app-access gate, not a replacement for the desktop OS password. It does not bypass Windows, macOS, or Ubuntu authentication. The desktop agent and target OS retain authority over the final computer unlock action.

## Production requirements

- TLS/mutually authenticated relay instead of exposing the development WebSocket listener directly to the internet.
- Signed installers and secure auto-update.
- Windows Credential Provider integration for legitimate pre-login unlock.
- macOS authorization/login helper with explicit user policy.
- Linux AT-SPI/Orca helper and secure session integration.
- NVDA controller/helper integration on Windows.
- VoiceOver accessibility helper on macOS.
- Screen capture/streaming with explicit user consent and privacy indicators.
