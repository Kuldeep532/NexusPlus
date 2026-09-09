# Nexus Plus PC Remote Control

Nexus Plus controls an explicitly paired Windows or Ubuntu computer through a local WebSocket connection.

## Design

- Android app: remote UI, pairing, device list, and input controls.
- Desktop agent: lightweight process on the user's PC. It owns the WebSocket listener and performs OS-specific input/system operations.
- Transport: direct LAN WebSocket (`ws://<pc>:<port>` for the first implementation). No remote desktop relay is required.
- Authentication: pairing code creates a device identity and long-lived random token. The token is stored locally on both endpoints and must not be logged.
- Authorization: the agent exposes only the allow-listed actions in `remoteProtocol.ts`.

## Supported platforms

The first supported platforms are Windows and Ubuntu. macOS is intentionally not part of the initial milestone so the implementation can be stabilized without adding another native input backend.

## First milestone

1. Pair by one-time code shown by the desktop agent.
2. Discover a computer on the same LAN through an explicit host/port entry or QR payload.
3. Connect using authenticated WebSocket.
4. Mouse move, left/right/middle click, and scroll.
5. Keyboard key events and text input.
6. Lock workstation.
7. Open a user-confirmed shell command.
8. Shutdown with a visible confirmation and delay.

The desktop agent must reject malformed messages, require authentication before actions, rate-limit high-frequency input, and terminate idle unauthenticated sessions.
