# Audio Format Converter — Native Runtime Status

## Branch

All work in this document is on the existing `audio-editor` branch. No new branch is required.

## Current guaranteed Android targets

- WAV: decoded through the Audio Editor native decoder and written as PCM WAV.
- AAC/M4A: decoded and encoded as AAC-LC in an MP4/M4A container with configurable bitrate and sample rate.

## Requested additional targets

The Format Converter UI advertises MP3, FLAC and OGG because these are intended targets. However, Android's built-in `MediaCodec` stack does not provide a portable, guaranteed encoder contract for all three formats across supported devices.

The repository currently contains FFmpeg-related video-editor documentation and a video-editor C++ adapter that invokes an `ffmpeg` command, but it does not contain an Android FFmpeg source package, native FFmpeg libraries, or a build/link step that makes such a runtime available to the Audio Editor module.

Do not claim MP3, FLAC or OGG export is complete until the approved FFmpeg runtime is actually packaged and linked into the Android build. The converter must continue to reject these targets explicitly rather than creating files with mismatched extensions.

## Required completion path

1. Add a pinned, approved FFmpeg 7.x source/runtime to the Android native dependency build.
2. Build only required ABIs with Android NDK/CMake.
3. Expose a native audio conversion operation to the Audio Editor module.
4. Route MP3, FLAC and OGG conversion through that native operation.
5. Preserve the existing WAV and AAC/M4A paths.
6. Verify output codec/container metadata and file readability before reporting success.
7. Include the required third-party license/source notices in release packaging.
