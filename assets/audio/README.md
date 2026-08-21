# Audio assets

Audio assets are organized by feature so each feature owns its sounds:

- `alarm/` — Time Announcer alarm/ringtone sounds
- `time-announcer/` — non-alarm time announcement sounds
- `selfie/` — selfie shutter/guidance sounds
- `media-player/` — local media/player UI sounds
- `online-radio/` — radio-related audio cues
- `battery-announcer/` — battery announcement cues
- `shared/` — only for an asset intentionally shared by multiple features

The alarm feature has a concrete asset contract in `alarm/README.md` matching the six filenames declared by `features/time-announcer/timeAnnouncerTypes.ts`.

This repository currently has no binary audio assets checked in. Add production-owned/licensed audio directly to the appropriate feature directory instead of restoring a flat asset layout or adding placeholders.
