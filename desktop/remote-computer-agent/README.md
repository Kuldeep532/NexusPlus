# Nexus Plus Remote Computer Agent

Desktop companion for Nexus Plus remote-computer access.

## Supported platforms

- Windows — NVDA-aware integration boundary; pre-login unlock requires a signed Nexus Credential Provider/helper.
- Ubuntu/Linux — Orca-aware integration boundary; session unlock uses `loginctl` when local policy permits it.
- macOS — VoiceOver-aware integration boundary; login unlock requires a signed Nexus authorization helper.

## Advanced voice control

The voice layer is now a finite, auditable intent system rather than a small list of exact phrases. Android sends the transcript; the desktop agent normalizes it and maps it to an allowlisted action. It never converts arbitrary speech into a shell command.

Supported desktop-level voice actions include:

- Media: play/pause, next track, previous track, and `play <search>` intent parsing.
- System audio: volume up, volume down, mute/unmute.
- System: lock the computer.
- App launch: browser, Chrome, Firefox, Edge, terminal, and file manager through an explicit allowlist.
- Keyboard: natural-language `press Enter`, arrow/navigation keys, and modifier shortcuts such as `press Ctrl+C`.
- Existing meeting and messaging intents remain available to application adapters; they are not guessed or executed with arbitrary app-specific shortcuts.

Each parsed voice command carries a confidence value and a `requiresConfirmation` flag. Messaging and unknown/ambiguous commands are fail-closed and require confirmation or an authorized adapter.

## Voice protocol hardening

- Voice and command challenges expire after 10 seconds.
- Voice transcripts are bounded to 4,000 characters.
- Voice requests are rate-limited per socket to 30 requests/minute.
- Every executable remote/voice request still requires the paired phone public-key signature.
- Agent protocol version is now 6 and advertises granular voice capabilities.

## Accessibility

The desktop UI exposes semantic regions, live status announcements, visible keyboard focus, large controls, and a keyboard shortcut help section. The agent advertises NVDA, Orca, or VoiceOver capability to the phone. Native accessibility helpers are required for operations that are not available through standard desktop APIs.

## Dynamic voice command lane

Android sends natural-language transcripts rather than embedding Zoom, WhatsApp, or YouTube command codes. The desktop agent parses the transcript into an auditable intent and routes application-specific actions through adapters.

The command lane is deliberately not arbitrary shell execution. Zoom/WhatsApp/media integrations should use official APIs or OS accessibility automation with explicit permissions. If no authorized adapter can safely handle a request, it returns a structured failure instead of guessing.

## Manual desktop builds

`.github/workflows/build-remote-agent.yml` is a **workflow_dispatch-only** workflow. It builds the Windows NSIS installer, macOS DMG, or Ubuntu/Linux AppImage on native GitHub-hosted runners and uploads each result as a workflow artifact. It is intentionally not triggered by push or pull request events.

Package scripts:

- `npm run typecheck`
- `npm run package:win`
- `npm run package:mac`
- `npm run package:linux`

The agent now includes an explicit `tsconfig.json`, so `npm run typecheck` has a deterministic TypeScript project instead of relying on implicit compiler discovery.

## Development security

The WebSocket listener is intended for a trusted local network during development. Do not expose port `47821` directly to the public internet. Production deployment requires authenticated TLS transport/relay, signed installers, firewall rules, secure updates, and OS-specific privileged accessibility/login helpers.

### Native helper requirements

- Windows: NVDA controller integration, low-level input helper, and signed Credential Provider for legitimate pre-login authentication.
- Ubuntu/Linux: AT-SPI/Orca helper, Wayland-compatible input helper, and secure session integration.
- macOS: VoiceOver accessibility helper, Accessibility-permission-aware input helper, and signed authorization/login helper.
