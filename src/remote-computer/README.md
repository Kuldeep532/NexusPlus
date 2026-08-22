# Remote Computer Access — Stage 1

Stage 1 establishes the product and security foundation for controlling a personal computer from Nexus Plus.

## Supported computers

The protocol models Windows, Ubuntu, and macOS explicitly. Screen-reader state supports NVDA on Windows, Orca on Ubuntu, and VoiceOver on macOS so later screen and command layers can preserve accessibility semantics.

## Stage 1 scope

- Computer identity, platform, connection state, capabilities, and screen-reader metadata.
- Pairing challenge model for a future authenticated computer agent.
- Phone biometric authorization using the existing Expo Local Authentication integration.
- Secure device-only storage for the phone-side device-key identity and seed material.
- A strict boundary between biometric authorization and OS unlocking.

## Security model

The phone biometric is an authorization gate. It does not expose, retrieve, or bypass the computer's password/PIN. The intended flow is:

1. The computer agent creates a short-lived pairing/unlock challenge.
2. Nexus Plus displays which computer is requesting access.
3. The user authenticates with the phone's biometric/device credential.
4. A future native keystore implementation signs the challenge with a device-bound private key.
5. The computer agent verifies that signature and applies its own local unlock policy.
6. The session is established only after successful verification.

Stage 1 intentionally does not claim to remotely unlock an OS yet. `buildUnlockRequest` leaves the cryptographic signature as a native-only TODO; a JS placeholder must never be treated as an unlock credential.

## Accessibility direction

The remote protocol should carry semantic events rather than only raw pixels wherever possible. Future stages should expose focused accessible element names, roles, states, and actions from NVDA/Orca/VoiceOver integrations so voice commands can target semantic controls.

## Planned stages

- Stage 2: native device-key signing, local computer agent, secure authenticated transport, and pairing UI.
- Stage 3: screen streaming plus keyboard/pointer/clipboard primitives.
- Stage 4: NVDA/Orca/VoiceOver semantic bridge and voice-command execution.
- Stage 5: OS-specific unlock handoff, session policy, audit trail, and production hardening.
