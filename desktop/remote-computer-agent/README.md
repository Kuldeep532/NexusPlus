# Nexus Plus Remote Computer Agent

Desktop companion for Nexus Plus remote-computer access.

## Supported platforms

- Windows — NVDA-aware integration boundary; pre-login unlock requires a signed Nexus Credential Provider/helper.
- Ubuntu/Linux — Orca-aware integration boundary; session unlock uses `loginctl` when local policy permits it.
- macOS — VoiceOver-aware integration boundary; login unlock requires a signed Nexus authorization helper.

## Accessibility

The desktop UI exposes semantic regions, live status announcements, visible keyboard focus, large controls, and a keyboard shortcut help section. The agent advertises NVDA, Orca, or VoiceOver capability to the phone. Native accessibility helpers are required for operations that are not available through standard desktop APIs.

## Keyboard shortcuts

- Ctrl+Space — mute/unmute microphone
- Ctrl+Shift+V — toggle meeting video
- F6 — move focus to agent status
- F8 — toggle voice input
- Ctrl+F10 — lock computer

These are an accessible agent-level shortcut registry. Application-specific shortcuts must be executed only after the corresponding application adapter confirms the active target.

## Dynamic voice command lane

Android sends natural-language transcripts rather than embedding Zoom, WhatsApp, or YouTube command codes. The desktop agent parses the transcript into an auditable intent and routes it through application adapters.

Examples of supported intent shapes include:

- "unmute" / "mute"
- "turn on video" / "turn off video"
- "send a message to <target> saying <message>"
- "play <search query>"
- "lock computer"

The command lane is deliberately not arbitrary shell execution. Zoom/WhatsApp/media integrations should use official APIs or OS accessibility automation with explicit permissions. If no authorized adapter can safely handle a request, it returns a structured failure instead of guessing or executing arbitrary commands.

## Manual desktop builds

`.github/workflows/build-remote-agent.yml` is a **workflow_dispatch-only** workflow. It builds the Windows NSIS installer, macOS DMG, or Ubuntu/Linux AppImage on native GitHub-hosted runners and uploads each result as a workflow artifact. It is intentionally not triggered by push or pull request events.

Package scripts:

- `npm run typecheck`
- `npm run package:win`
- `npm run package:mac`
- `npm run package:linux`

## Development security

The WebSocket listener is intended for a trusted local network during development. Do not expose port `47821` directly to the public internet. Production deployment requires authenticated TLS transport/relay, signed installers, firewall rules, secure updates, and OS-specific privileged accessibility/login helpers.

### Native helper requirements

- Windows: NVDA controller integration, low-level input helper, and signed Credential Provider for legitimate pre-login authentication.
- Ubuntu/Linux: AT-SPI/Orca helper, Wayland-compatible input helper, and secure session integration.
- macOS: VoiceOver accessibility helper, Accessibility-permission-aware input helper, and signed authorization/login helper.
