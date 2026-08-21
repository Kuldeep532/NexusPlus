# NexusPlus Clock native alarm integration

The Clock UI is implemented in `artifacts/mockup-sandbox/src/components/mockups/Clock`.

For a production Android build, the alarm scheduler must be backed by Android's exact alarm APIs rather than an in-process JavaScript timer. The native layer should:

- schedule each enabled alarm with `AlarmManager.setExactAndAllowWhileIdle()` for the next occurrence;
- persist alarm definitions and re-schedule them after reboot using `BOOT_COMPLETED`;
- use a `BroadcastReceiver` to receive the alarm event when the app UI/process is not running;
- start alarm audio using a foreground service/audio-focused playback path and show a full-screen alarm notification/activity;
- request exact-alarm permission where required by the target Android version/policy;
- create the required notification channel and request notification permission on supported Android versions;
- handle snooze by scheduling a new exact alarm;
- reschedule repeating alarms after each fire.

Do not rely on a background React timer for alarm reliability.
