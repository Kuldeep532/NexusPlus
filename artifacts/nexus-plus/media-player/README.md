# Nexus Media Player

Reusable Expo + React Native media module translated from the Kotlin Music feature.

## Includes

- Audio and video playback through Expo's current native media APIs.
- Local media-library discovery for audio/video assets where the platform permission model allows it.
- Queue, next/previous, seek, repeat, shuffle, playback-rate, volume and progress controls.
- Subtitle-track model and SRT parser. Video subtitle rendering is delegated to native `expo-video` subtitle tracks when source metadata provides them; custom/local subtitle files can be parsed into timed cues for an accessible overlay layer.
- Accessibility-first labels, hints, live status, minimum touch targets and screen-reader-friendly descriptions.
- AI service boundary designed for fully local inference: transcript, chaptering, summarisation, media tagging and smart search can be backed by an on-device runtime without sending media to a server.

## Expo packages

Use SDK-compatible versions with `npx expo install` rather than pinning arbitrary versions. Current Expo docs list `expo-audio`, `expo-video`, `expo-media-library`, and `expo-file-system` as the native building blocks for these capabilities.

Example:

```bash
npx expo install expo-audio expo-video expo-media-library expo-file-system
```

For local AI, keep the runtime behind `LocalMediaAI` so a project can use a native ONNX Runtime, TensorFlow Lite, MediaPipe, or another local inference package appropriate to its Expo development build. Do not put inference credentials in the app bundle.
