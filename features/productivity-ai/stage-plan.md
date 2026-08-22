# Productivity AI staged rollout

## Stage 1 — lightweight local workflow (this PR)
- Typed workflow planner for email, meetings and calendar.
- Deterministic Hindi/English/Hinglish message composer with no bundled model weights.
- Provider interface with fail-closed default.
- Accessible AI Workflow screen and registry entry.
- Device-native voice bridge contract using installed speech recognition and TTS.

## Stage 2 — account provider
- Add Google OAuth/consent and a Google Calendar/Gmail provider adapter.
- Keep credentials in secure storage; never expose tokens to the composer.
- Add explicit send/create confirmation and idempotency keys.

## Stage 3 — smarter generation without APK bloat
- Optional remote small-model adapter behind the composer interface.
- Send only task context and selected key points.
- Fall back to the deterministic composer whenever the provider is unavailable.

## Stage 4 — automation
- Add scheduled/background workflows only after provider authorization.
- Retry transient failures with idempotency.
- Surface every external action in an accessible activity log.
