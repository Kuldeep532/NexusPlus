# Reminder migration — staged delivery

All reminder stages intentionally stay on one branch and one pull request.

## Stage 1 — React Native + Expo foundation — complete
- Accessible reminder creation flow, local notifications, English/Hindi selection, downloaded-voice preference and system TTS fallback.

## Stage 2 — Custom timing + local reminder backend — complete
- Custom one-time local time, daily, weekly and repeat-interval scheduling.
- Persistent local reminder records and scheduler reconciliation.

## Stage 3 — Production reminder engine — in progress
- Durable lifecycle metadata and update timestamps.
- Backend enable/disable, delete and snooze operations.
- Reminder UI now exposes Edit, Enable/Disable, Snooze and Delete actions.
- Home registration under **Productivity Tools**.
- Existing downloaded ONNX voices remain preferred when Piper is available, with system TTS fallback.
- Remaining production work: Android headless Piper after process death, reboot restoration, exact-alarm handling and automated tests.

No separate PR is intended; all remaining Stage 3 work continues on this same PR.
