# Audio Compressor

The Audio Compressor uses native Android `MediaCodec` decode/encode and `MediaMuxer` output so bitrate and sample-rate settings are applied to the generated AAC/M4A file rather than only changing UI metadata.

Presets currently include:
- Voice Small: 48 kbps, 22.05 kHz
- Voice Balanced: 64 kbps, 32 kHz
- Music Small: 96 kbps, 44.1 kHz
- Music Balanced: 128 kbps, 44.1 kHz

The feature is wired through `features/audio-editor/audioCompressor.ts` and the `AudioEditorNative.compress(...)` contract. The Android native module must expose the `compress` function in `AudioEditorNativeModule.kt` before the screen can execute in a built app.

Existing Audio Editor status checked before adding Compressor:
- Audio Trimmer: native processing exists and is registered.
- Mix Audio: native multi-track processing exists and is registered.
- Audio to Video: UI/timing contract exists, but export remains pending because the native video renderer is unavailable.
- Sound-effect transport: current native helper explicitly documents PCM mixing as pending, so it should not be treated as a completed child tool.
