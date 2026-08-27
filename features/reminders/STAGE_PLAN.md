# Reminder migration — staged delivery

All reminder stages remain on one branch and one PR (#38).

## Stage 1 — complete
React Native + Expo foundation, accessible notifications, English/Hindi voice selection, downloaded ONNX voice preference and system TTS fallback.

## Stage 2 — complete
Custom one-time timing, daily/weekly/repeat-interval schedules, persistent records and scheduler reconciliation.

## Stage 3 — complete in repository scope
- Production lifecycle persistence: enabled/disabled, edit/update, delete and snooze.
- Reminder cards expose Edit, Enable/Disable, Snooze and Delete.
- Home registration under **Productivity Tools**.
- Scheduling validates invalid dates and past one-time times instead of silently accepting them.
- Existing downloaded ONNX/Piper-preferred voice path and system TTS fallback remain intact.

## Native/platform follow-up
The repository still needs a real Android headless Piper ONNX runtime if reminders must synthesize downloaded voice audio after the app process is fully terminated. Reboot restoration and Android exact-alarm handling also require native platform integration and should be implemented/tested against the project's actual Android build configuration. Automated device-level tests are recommended before release.

No separate PR is intended for this feature.
