# Reminder migration — staged delivery

This feature is intentionally delivered in small stages while staying on one pull request.

## Stage 1 — React Native + Expo foundation — complete
- Accessible reminder creation flow, local notifications, English/Hindi selection, downloaded-voice preference and system TTS fallback.

## Stage 2 — Custom timing + local reminder backend — in progress
- Custom one-time local time.
- Daily recurring reminders.
- Weekly recurring reminders.
- Repeat-every-N-minutes reminders.
- Persistent local reminder records using AsyncStorage.
- Scheduler reconciliation API and pending-reminder count.
- Reschedule/cancel backend primitives.
- Existing downloaded ONNX voice library remains the source of installed voices; Piper is preferred when its native bridge exists and system TTS remains the fallback.

### Stage 2 remaining native work
- Add the actual Android `NexusPiper` runtime and background/headless execution so ONNX speech can be generated after the app process is gone.
- Add Android reboot restoration and exact-alarm handling where the platform requires it.

## Stage 3 — Production reminder engine
- Stronger lifecycle reconciliation for fired/cancelled notifications.
- Full reminder editing and enable/disable controls.
- Automated tests for timing, persistence, cancellation, voice selection and fallback.

All stages belong to this single PR; no separate PR is intended for each stage.
