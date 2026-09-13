# Audio Editor Stage 70

## Scope
Stage 70 introduces the Audio to Video editor flow and upgrades Audio Mix to a native multi-track project contract.

## Audio Trimmer verification
The Audio Trimmer screen probes duration through `AudioEditorNative.probe()` and exports selected ranges through `AudioEditorNative.trim()`. The Android implementation uses `MediaExtractor` and `MediaMuxer`; it is real native processing rather than a UI-only placeholder.

## Audio Mix verification
The original UI supported one base + one overlay, while the native contract also accepted only one overlay. Stage 70 adds `mixProject` with an arbitrary list of overlay clips. Mixing is performed in a single native pass, and output duration is extended to the latest active track endpoint. The JS layer keeps metadata only and does not decode PCM.

## Audio to Video
The new `/audio-editor/audio-to-video` screen:
- requires a selected audio source before image timing starts;
- calculates total image duration against audio duration;
- disables image upload when the audio timeline is full;
- exposes per-image seconds editing and `-1s` / `+1s` controls;
- blocks image addition when no meaningful audio time remains;
- exposes a `Remove image` action for every image;
- prevents duration adjustments from exceeding the audio timeline by clamping to available time;
- only enables Create Video when image timing covers the audio duration.

## Known native dependency
The repository's stable TypeScript video bridge currently reports that the native video engine is not installed. Stage 70 therefore does not fabricate an MP4 export. The Audio to Video feature has a dedicated native operation contract, but the actual Android/JNI renderer must be implemented before the feature can be declared export-complete.
