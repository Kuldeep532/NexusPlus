# Nexus Assistant — Stage 1

Stage 1 establishes the product boundary without bundling AI weights into the APK.

## Architecture

- `@elizaos` is an architectural reference/integration target, not copied wholesale into the mobile bundle.
- Local chat history is persisted with `expo-sqlite` in `nexus-assistant.db`.
- Model and Piper voice files are downloaded on demand to the app's document storage.
- No model weights are bundled into the APK.
- Stage 1 performs no remote AI inference.

## Planned stages

1. Foundation: private SQLite chats, model/voice catalog, download/delete lifecycle, accessible Assistant screen.
2. Native local inference: small on-device chat runtime/bridge with streaming responses and hardware-aware fallback.
3. Agent actions: safe capability registry for device actions, app actions, files, reminders, media, and other Nexus tools with explicit user confirmation for consequential actions.
4. Piper voice: native Piper/Sherpa-ONNX bridge, high-quality downloadable voice, speech playback and voice settings.
5. Live chat: low-latency streaming speech-to-text → local agent → Piper TTS loop, with interruption/barge-in and hands-free mode.
6. Privacy/controls: delete model, delete voice, delete chat/session, clear all local data, export/import optional local backup, and an offline-only indicator.
7. Performance hardening: startup deferral, bounded context windows, response streaming, thermal/battery safeguards, storage checks, and APK size CI gate.

## Size policy

The APK must remain below 150 MB. The app must not package chat-model weights or Piper voices. Downloaded assets are independent of the APK and user-deletable.

The first model catalog entry is SmolLM2 360M Instruct Q4_K_M (~271 MB), which intentionally exceeds the APK limit but is suitable as an optional post-install download. A later native backend may support smaller/alternative formats where device performance permits.

The initial Piper catalog entry is `en_US-lessac-high`, selected as a high-quality English voice. Voice quality and storage size are presented before download.

## Privacy boundary

Nexus Assistant chat messages are stored in SQLite on-device. Stage 1 does not send chat text to a remote AI service. Future remote providers, if ever exposed, must be opt-in and visibly separated from the offline/local mode.
