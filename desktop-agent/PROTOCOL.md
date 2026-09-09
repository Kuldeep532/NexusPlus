# Desktop Agent Implementation Contract

## Required behavior

1. Bind only to the LAN interface selected by the user; never expose a public listener by default.
2. Generate a short-lived pairing code and display it locally.
3. Authenticate the Android client with a random per-device token after pairing.
4. Reject every `action` message until authentication succeeds.
5. Validate JSON shape, protocol version, request IDs, action types, and numeric ranges.
6. Rate-limit mouse movement and reject oversized text payloads.
7. Close unauthenticated sockets after a short timeout and close malformed sessions.
8. Record only operational status needed for troubleshooting; never log tokens, passwords or typed text.
9. Require confirmation in the app for disruptive actions such as shutdown.
10. Provide a local “revoke all pairings” control.

## OS backends

Windows should use the operating system's supported user-input/system APIs for mouse, keyboard, lock and shutdown.

Ubuntu should detect the active desktop session. Prefer supported desktop/system APIs for lock and shutdown. Mouse/keyboard injection must be implemented using a user-approved backend appropriate to the active session; Wayland compositors generally restrict global input injection, so the installer must clearly state any required desktop permissions or supported session limitations.

The agent must fail closed when a requested operation is unsupported instead of falling back to arbitrary shell execution.
