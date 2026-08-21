# Nexus Plus Audio Assets

Place the bundled app audio files in this directory using these exact filenames:

- `document_processing.mp3` — document/PDF processing feedback
- `notification.mp3` — generic app notification sound
- `low_battery.mp3` — low-battery announcement cue
- `time_assisted_beep.mp3` — Time Assisted announcement cue
- `pageflip.mp3` — Book Reader page-turn cue
- `selfie_shutter_nexus_01.mp3` — Selfie camera shutter cue
- `full_charge.mp3` — fully-charged battery cue

These are intentionally named with lowercase, underscore-separated filenames so Android and Metro/Expo asset resolution stay predictable.

The actual binary audio files are not committed by this change; upload the seven files from the supplied sound ZIP manually into this directory.
