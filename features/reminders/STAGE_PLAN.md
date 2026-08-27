# Reminder migration — staged delivery

This feature is intentionally delivered in small stages while staying on one pull request.

## Stage 1 — React Native + Expo foundation — complete
- Accessible reminder creation flow, local notifications, English/Hindi selection, downloaded-voice preference and system TTS fallback.

## Stage 2 — Custom timing + local reminder backend — complete
- Custom one-time local time, daily, weekly and repeat-interval scheduling.
- Persistent local reminder records and scheduler reconciliation.

## Stage 3 — Production reminder engine — in progress
- Lifecycle backend supports durable enabled/disabled state, delete and snooze operations.
- Home registration is under **Productivity Tools**, keeping reminders discoverable without overcrowding the main-feature list.
- Reminder records now have update/enable persistence primitives.
- Next UI work: expose edit, enable/disable and snooze actions directly on each reminder card.
- Native work still required: Android headless Piper execution after app process death, reboot restoration and exact-alarm handling where required.
- Automated tests remain required for timing, persistence, cancellation, lifecycle reconciliation and voice fallback.

All stages belong to this single PR; no separate PR is intended for each stage.
