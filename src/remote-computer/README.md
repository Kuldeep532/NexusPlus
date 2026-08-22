# Remote Computer Access — Stages 1–6

Nexus Plus pairs an Android phone with a personal Windows, Ubuntu/Linux, or macOS computer through the Nexus Plus desktop agent.

## Stage 1–3 — secure remote foundation

- Computer identity, platform, connection state, capabilities, and screen-reader metadata.
- Android Keystore EC P-256 signing identity; private key never leaves Android Keystore.
- Human-verifiable pairing and fresh challenge/response.
- Allowlisted keyboard, clipboard, pointer, lock, screen-reader, and voice-command protocol.
- Every protected remote command receives a fresh desktop challenge and requires phone user authentication plus a device-key signature.
- The desktop agent rejects arbitrary shell/command execution.

## Stage 4 — Android control center

- Remote Computer landing screen.
- Dedicated connector/pairing screen.
- Dedicated control screen.
- Accessible quick controls for screen readers, keyboard Enter, lock, and biometric unlock.
- Voice Input on/off switch.

## Stage 6 — Android protection and secure connection state

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

`NexusRemoteKeyModule` is the native signing authority. Its private key remains in Android Keystore and now requires Android user authentication for every signature use. The JavaScript layer only receives the public key or a signature; it never receives the private key.

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
