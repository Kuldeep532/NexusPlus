# Nexus Plus Remote Computer Agent

Desktop companion for Nexus Plus remote-computer access.

## Supported platforms

- Windows — NVDA-aware integration boundary; pre-login unlock requires a signed Nexus Credential Provider/helper.
- Ubuntu/Linux — Orca-aware integration boundary; session unlock uses `loginctl` when local policy permits it.
- macOS — VoiceOver-aware integration boundary; login unlock requires a signed Nexus authorization helper.

## Stage 7 desktop control

The agent accepts the structured Nexus Plus command protocol and never exposes arbitrary shell execution to the phone.

Supported command families:

- Keyboard key presses with validated keys and modifiers.
- Pointer move, click, and double-click through platform input tooling/helpers.
- Clipboard read/write subject to local OS tooling and policy.
- Authenticated voice transcript receiving with a fresh challenge and phone biometric/device-key signature.
- Authenticated voice-audio frame receiving/acknowledgement for the future audio sink.
- Computer lock.
- Screen-reader commands remain behind the native NVDA/Orca/VoiceOver helper boundary.
- Screen streaming and OS-level audio playback/recording are capability boundaries; they require explicit native capture/output components before production use.

Every sensitive operation uses the paired phone public key and a fresh challenge. The computer password is never sent to the phone.

## Development security

The WebSocket listener is intended for a trusted local network during development. Do not expose port `47821` directly to the public internet. Production deployment requires authenticated TLS transport/relay, signed installers, firewall rules, secure updates, and OS-specific privileged accessibility/login helpers.

### Native helper requirements

- Windows: NVDA controller integration, low-level input helper, and signed Credential Provider for legitimate pre-login authentication.
- Ubuntu/Linux: AT-SPI/Orca helper, `xdotool`/Wayland-compatible input helper, and secure session integration.
- macOS: VoiceOver accessibility helper, Accessibility-permission-aware input helper such as `cliclick` or a native CoreGraphics component, and signed authorization/login helper.
