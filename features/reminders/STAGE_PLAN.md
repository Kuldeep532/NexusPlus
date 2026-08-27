# Reminder migration — staged delivery

All reminder stages intentionally stay on one branch and one pull request.

## Stage 1 — React Native + Expo foundation — complete
- Accessible reminder creation flow, local notifications, English/Hindi selection, downloaded-voice preference and system TTS fallback.

## Stage 2 — Custom timing + local reminder backend — complete
- Custom one-time local time, daily, weekly and repeat-interval scheduling.
- Persistent local reminder records and scheduler reconciliation.

## Stage 3 — Production reminder engine — in progress
- Durable reminder lifecycle metadata: enabled state, update timestamp and snooze timestamp.
- Backend operations for enable/disable, delete and snooze.
- Home registration under **Productivity Tools** so reminders are discoverable as a planning/productivity feature.
- Existing downloaded ONNX voices remain preferred when the native Piper bridge is available; system TTS remains fallback.
- Reminder UI still needs direct edit, enable/disable and snooze actions wired to the lifecycle backend.
- Native Android work still required for true headless Piper execution after process death, reboot restoration and exact-alarm handling where required.
- Automated tests remain required for timing, persistence, cancellation, lifecycle reconciliation and voice fallback.

No separate PR is intended for this feature; remaining Stage 3 work continues on the same PR.
