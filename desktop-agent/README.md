# Nexus Plus Desktop Agent

This directory contains the platform-neutral contract for the Nexus Plus PC Remote agent.

The runtime implementation is intentionally split by operating system:

- `windows/`: Windows input and system-control backend.
- `ubuntu/`: Ubuntu X11/Wayland input and system-control backend.
- shared transport: authenticated WebSocket server on the local network.

The agent is user-installed and user-started. It does not provide persistence, hidden execution, credential collection, or arbitrary inbound command execution. Actions are accepted only after pairing and authentication and must match the allow-list in `features/pc-remote/remoteProtocol.ts`.

## Transport contract

The agent listens on an explicit user-configured port (default `8765`). Pairing displays a short-lived code. After pairing, the agent issues a cryptographically random bearer token bound to the paired device identity. Authentication is required before control messages are accepted.

The first production milestone should ship native binaries/installers for Windows and Ubuntu without adding a new runtime dependency to the Android APK beyond the already-used WebSocket API.
