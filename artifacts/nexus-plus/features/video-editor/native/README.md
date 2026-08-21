# NexusPlus Video Editor Native Runtime

This directory contains the production Android-native boundary for video editing.

## Runtime components

- FFmpeg 7.x source/toolchain: used for codec, demuxer, filter, muxer and export operations.
- whisper.cpp: optional on-device speech recognition runtime for captions/transcription.
- Android NDK + CMake: builds the NexusPlus JNI shared library.

## Build rule

Do not ship downloaded prebuilt binaries from this directory. The Android build should compile pinned native dependencies from approved source archives and package only the ABIs selected by the app.

## Current native API

`VideoEditorNative.hpp` defines the stable operation contract. `VideoEditorJni.cpp` exposes it to Kotlin/Java. The TypeScript feature must call the native adapter rather than invoking shell commands directly.

## Production operations

The native layer covers trim, speed, crop/resize, rotate, flip, extract-audio, reverse, freeze-frame, volume, denoise and loudness normalization. Timeline operations such as merge and split are composed by the editor job planner before dispatch.

## AI runtime

Captioning and transcript generation should use a quantized whisper.cpp model downloaded or installed as an app asset. Keep model selection configurable (`tiny`, `base`, or a quantized language-specific model) so low-memory Android devices do not load a large model unnecessarily.

## Licensing

The final application must ship the corresponding license notices and source-offer notices for each third-party dependency actually included in the final binary. Do not remove those notices during release packaging.
