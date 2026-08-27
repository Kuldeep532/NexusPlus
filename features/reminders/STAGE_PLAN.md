# Reminder migration — staged delivery

This feature is intentionally delivered in small stages while staying on one pull request.

## Stage 1 — React Native + Expo foundation
- Recreates the supplied Android reminder flow with title, message, minute delay, presets, active queue, cancellation, and accessibility labels.
- Uses `expo-notifications` for local scheduling and the existing Nexus notification sound/channel.
- Adds a voice layer that prefers an installed Nexus Plus voice and the native Piper bridge when available, with `expo-speech` as the reliable system-TTS fallback.
- Uses the existing downloaded ONNX voice library rather than bundling large voice models into the APK.
- Adds English and Hindi voice selection from the voices already downloaded by Nexus Plus.

## Stage 2 — Native Piper execution
- Add the actual Android `NexusPiper` native runtime so downloaded ONNX models can synthesize dynamic reminder text while the app is backgrounded or closed.
- Keep the same JS voice contract so the UI and scheduler do not need to be redesigned.

## Stage 3 — Production reminder engine
- Persist reminders and voice choices across process/device restart.
- Reconcile cancelled/fired reminders with the scheduled notification queue.
- Restore schedules after reboot and handle Android exact-alarm/background restrictions where required.
- Add automated tests for scheduling, cancellation, voice selection, and fallback behavior.

All stages belong to this single PR; no separate PR is intended for each stage.
