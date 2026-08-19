# Time Announcer

Accessible time utility for Nexus Plus.

## Included

- Current-time display and on-demand TTS announcement.
- Automatic time announcements at 15, 30, or 60 minute intervals.
- Device-local TTS voice selection, preferring Enhanced voices when available.
- World clock for New York, London, Dubai, Singapore, Tokyo, and Sydney.
- Stopwatch with start, pause, reset, and up to 10 recent laps.
- Native scheduled alarms using Expo Notifications.
- Android alarms use the `nexus-alarm` notification channel with the system/default notification sound rather than bundling a custom ringtone.
- Screen-reader labels and state announcements throughout the feature.

## Build note

`expo-notifications` requires a rebuilt native app for its Android configuration plugin to take effect. Local notifications are not equivalent to a cloud push service; alarms are scheduled on-device.
