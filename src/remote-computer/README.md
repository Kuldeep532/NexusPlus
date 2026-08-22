# Remote Computer Access — Stages 1–3

Nexus Plus can pair an Android phone with a personal Windows, Ubuntu/Linux, or macOS computer through the Nexus Plus desktop agent.

## Stage 1 — foundation

- Computer identity, platform, connection state, capabilities, and screen-reader metadata.
- Pairing and unlock challenge model.
- Phone biometric authorization.
- Device-only storage for the phone-side identity.

## Stage 2 — authenticated desktop agent

- Android Keystore EC P-256 signing identity.
- Authentication-bound signing key; the private key never leaves Android Keystore.
- Electron desktop agent with OS credential-store protection.
- Human-verifiable pairing code.
- Fresh challenge/response for unlock.
- Linux session unlock adapter where the local OS policy permits it.
- Windows/macOS pre-login unlock remains behind their native credential/authorization helper boundary; no password bypass is implemented.

## Stage 3 — remote control and accessibility command protocol

The phone can send an explicit, allowlisted command model instead of arbitrary shell commands:

- Keyboard key presses with validated keys/modifiers.
- Clipboard read/write protocol.
- Pointer command model reserved for an OS accessibility helper.
- Screen-reader actions for NVDA, Orca, and VoiceOver through a platform helper boundary.
- Lock command.
- Voice commands can map to the same command model using `source: 'voice'` and preserve the original transcript for audit/UI feedback.
- Every remote command receives a fresh desktop challenge and requires successful phone biometric authorization plus a device-key signature.

The desktop agent rejects arbitrary shell/command execution. Unsupported accessibility operations return an explicit `unsupported` result until their native helper is installed.

## Security model

1. The desktop creates a fresh challenge.
2. Nexus Plus authenticates the phone user.
3. Android Keystore signs the challenge with the authentication-bound device key.
4. The desktop verifies the signature against the paired public key.
5. Only then is the requested allowlisted operation executed.

The desktop never receives the phone private key or the computer password.

## Production requirements for later stages

- TLS/mutually authenticated relay instead of exposing the development WebSocket listener directly to the internet.
- Signed installers and secure auto-update.
- Windows Credential Provider integration for legitimate pre-login unlock.
- macOS authorization/login helper with explicit user policy.
- Linux AT-SPI/Orca helper and secure session integration.
- NVDA controller/helper integration on Windows.
- VoiceOver accessibility helper on macOS.
- Screen capture/streaming with explicit user consent and privacy indicators.
