# Nexus Plus Remote Computer Agent

Desktop companion for Nexus Plus remote-computer access.

## Supported platforms

- Windows — NVDA-aware integration boundary; pre-login unlock requires a signed Nexus Credential Provider/helper.
- Ubuntu/Linux — Orca-aware integration boundary; session unlock uses `loginctl` when local policy permits it.
- macOS — VoiceOver-aware integration boundary; login unlock requires a signed Nexus authorization helper.

## Stage 3 remote control

The agent accepts only the structured Nexus Plus command protocol. It does not expose arbitrary shell execution to the phone.

Supported command families:

- Validated keyboard key presses.
- Clipboard operations subject to local OS tooling/policy.
- Lock the current computer session.
- Screen-reader and pointer command boundaries for native accessibility helpers.

Each command is protected by a fresh challenge and phone biometric/device-key signature. Unsupported native operations return a structured `unsupported` result rather than executing a fallback shell command.

## Development security

The WebSocket listener is intended for a trusted local network during development. Do not expose port `47821` directly to the public internet. Production deployment requires authenticated TLS transport/relay, signed installers, firewall rules, secure updates, and OS-specific privileged accessibility/login helpers.
