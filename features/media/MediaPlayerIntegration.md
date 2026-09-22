# Shared Media Playback

The app uses one persistent audio session for Nexus Plus, Geeta Nexus, and the standalone Media Player surface.

## UX rules
- Inside the app: show a compact mini-player at the bottom when audio is active.
- Leaving a feature screen does not stop active audio.
- Hardware Back from Now Playing returns to the media library without stopping audio.
- Selecting another audio item disposes the previous audio player before the new one starts.
- Starting a video stops the persistent audio session completely before video playback starts.
- Leaving the app may continue active audio through Android background audio.
- When audio is explicitly closed/stopped, the mini-player state and Android media notification are removed.
- Paused media left in the background is cleaned up automatically after the idle window; active playback is not stopped by that cleanup.
- The in-app mini-player is not shown over the OS launcher or other applications.
- Stop is explicit; navigating between Nexus Plus and Geeta Nexus preserves playback.
- Gita Nexus audio uses the same player/session and never creates a second playback engine.

## Native integration

The Android NexusMediaPlaybackService is a foreground lifecycle and notification surface only. It does not create a MediaPlayer or decode audio.

Playback ownership remains in PersistentMediaController, which wraps the existing Expo audio engine. The native notification bridge only mirrors title/play state and forwards pause/resume/stop commands back to the app process. This avoids duplicate playback engines and reduces APK/runtime overhead.

## Background and accessibility

Media cleanup is scoped to the media player lifecycle and does not stop or disable NexusVisionAccessibilityService. The accessibility service remains an independently declared Android accessibility service and follows Android's accessibility-service lifecycle rules.
