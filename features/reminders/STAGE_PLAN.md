# Reminder migration — staged delivery

This feature is intentionally delivered in small stages while staying on one pull request.

## Stage 1 — React Native + Expo foundation — complete
- Accessible reminder creation flow, local notifications, English/Hindi selection, downloaded-voice preference and system TTS fallback.

## Stage 2 — Custom timing + local reminder backend — complete
- Custom one-time local time, daily, weekly and repeat-interval scheduling.
- Persistent local reminder records and scheduler reconciliation.

## Stage 3 — Production reminder engine — started
- Lifecycle backend now supports durable enabled/disabled state, delete and snooze operations.
- Home registration is now under **Productivity Tools**, keeping reminders discoverable without overcrowding the main-feature list.
- Existing downloaded ONNX voices remain the preferred voice source when the native Piper bridge is available, with system TTS fallback.
- Next native work: Android headless Piper execution for reminders when the app process is gone, plus reboot restoration/exact-alarm handling.
- Remaining UI work: expose edit, enable/disable and snooze actions directly on each reminder card, then add automated tests for timing, persistence, cancellation and voice fallback.

All stages belong to this single PR; no separate PR is intended for each stage.
