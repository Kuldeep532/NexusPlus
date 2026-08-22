# Shared Media Playback

The app uses one persistent audio session for Nexus Plus, Geeta Nexus, and the standalone Media Player surface.

## UX rules
- Inside the app: show a compact mini-player at the bottom when audio is active.
- Leaving a feature screen does not stop active audio.
- Leaving the app: playback may continue through Android background audio, with system media notification/controls.
- The in-app mini-player is not shown over the OS launcher or other applications.
- Stop is explicit; navigating between Nexus Plus and Geeta Nexus preserves playback.
- Gita Nexus audio uses the same player/session and never creates a second playback engine.

## Native integration target
The existing Expo audio session is configured for background playback. A native Android media-session/notification adapter should surface play, pause, previous, next, seek, and stop controls without duplicating the playback engine.
