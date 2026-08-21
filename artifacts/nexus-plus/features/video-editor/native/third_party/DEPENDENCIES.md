# Native dependency manifest

These are the intended source dependencies for the production video editor runtime.

## Required

### FFmpeg
Purpose: decode, encode, mux, demux, filters, audio processing and export.
Source: https://github.com/FFmpeg/FFmpeg
Integration: build from source with Android NDK using the project's pinned configuration.

### whisper.cpp
Purpose: on-device speech-to-text, captions and transcript generation.
Source: https://github.com/ggml-org/whisper.cpp
License: MIT.
Integration: build the C/C++ core for Android and load a quantized Whisper model as an app asset.

## Optional native AI

### MediaPipe
Purpose: face detection and tracking for face blur and auto-reframe.
Source: https://github.com/google-ai-edge/mediapipe
Integration: use the Android-supported native graph/runtime appropriate to the selected release.

### OpenCV
Purpose: deterministic scene detection, frame difference, histogram analysis and image processing.
Source: https://github.com/opencv/opencv
Integration: Android native build, only the required modules.

## Not bundled

Cloud AI APIs, proprietary hosted LLM/video APIs and opaque prebuilt native binaries are intentionally not part of the editor runtime.

## Release requirement

Every dependency used by the final APK must have its license text and required attribution included in the application's third-party notices. Exact versions and source archives must be pinned in the release build before publishing.
