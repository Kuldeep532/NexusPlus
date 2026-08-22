# Nexus Plus Remote Computer Agent

The desktop side of Nexus Plus remote computer access.

## Stage 2 security flow

1. The Android app creates an EC P-256 device-bound key in Android Keystore.
2. The public key is sent during pairing; the private key never leaves the phone.
3. The desktop agent displays a pairing code and stores the approved phone public key in the operating system credential store.
4. A remote unlock request causes the desktop agent to generate a fresh random challenge.
5. The phone requires local biometric authentication and signs the challenge with the device-bound private key.
6. The desktop verifies the signature against the pinned phone public key.
7. Only after successful verification does the platform unlock adapter run.

## Final desktop application

The Electron application provides an accessible status panel, pairing verification, and an installed-agent control surface. The agent listens on TCP/WebSocket port `47821` by default.

For production internet access, put this agent behind a mutually authenticated relay/TLS transport. Do not expose the raw agent port directly to the public internet.

## OS unlock policy

The agent deliberately does not bypass OS passwords or defeat login security controls.

- **Ubuntu/Linux:** the current-user desktop session can use `loginctl unlock-session` when the OS policy allows it.
- **Windows:** a dedicated Nexus Windows Credential Provider/helper is required for pre-logon unlock. A normal Electron application cannot unlock the Windows sign-in screen.
- **macOS:** a dedicated Nexus authorization/login helper and an explicitly enrolled user policy are required. A normal application cannot bypass the macOS login credential UI.

This distinction is intentional: the Android biometric proves possession of the enrolled phone key; the desktop OS still decides whether its configured unlock mechanism may act.

## Development

```bash
pnpm install
pnpm start
```

Do not publish the development WebSocket port directly to the internet. Production packaging should add a signed installer, auto-update policy, firewall rules, service startup, and the platform-specific privileged helper only after security review.
