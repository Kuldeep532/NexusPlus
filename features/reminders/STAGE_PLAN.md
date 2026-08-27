# Reminder migration — staged delivery

All reminder stages intentionally stay on one branch and one pull request.

## Stage 1 — React Native + Expo foundation — complete
- Accessible reminder creation flow, local notifications, English/Hindi selection, downloaded-voice preference and system TTS fallback.

## Stage 2 — Custom timing + local reminder backend — complete
- Custom one-time local time, daily, weekly and repeat-interval scheduling.
- Persistent local reminder records and scheduler reconciliation.

## Stage 3 — Production reminder engine — in progress
- Durable reminder lifecycle metadata and persistence update timestamps.
- Backend operations for enable/disable, delete and snooze.
- Home registration under **Productivity Tools** so reminders are discoverable as a planning/productivity feature.
- Reminder types now carry lifecycle metadata for updates and snoozing.
- Existing downloaded ONNX voices remain preferred when the native Piper bridge is available; system TTS remains fallback.
- Remaining work: direct edit/enable/snooze UX integration, native Android headless Piper execution, reboot restoration, exact-alarm handling and automated tests.

No separate PR is intended for this feature; remaining Stage 3 work continues on the same PR.
