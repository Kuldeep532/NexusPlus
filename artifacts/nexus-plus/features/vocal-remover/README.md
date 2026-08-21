# Native C++ Vocal Remover

The UI and job orchestration stay in TypeScript, but the audio-processing boundary is native.

## Architecture

- `android/app/src/main/cpp/nexus_vocal_remover.*` contains the C++ audio-processing core.
- `nexus_vocal_remover_jni.cpp` exposes the native processor through JNI.
- `VocalRemoverNative.java` is the Android-side JNI declaration.
- `features/vocal-remover/nativeVocalRemover.ts` is the React Native boundary and never performs PCM separation itself.
- The media-player vocal-remover service selects the native engine first.

## Processing path

Android media/codec code decodes source media to native PCM. The C++ core processes bounded chunks and reports progress without blocking the JavaScript thread. The current native fallback implements a deterministic stereo Mid/Side split. This is useful for center-panned mixes and provides the low-latency native path.

For neural-quality separation, the same `VocalRemover` core should load a locally packaged or cached ONNX Demucs/MDX-family model. The model runner belongs in C++, not TypeScript, and should be isolated behind the same native interface.

## Important limitation

The current C++ sample processor is not equivalent to a full neural separator: phase/center cancellation cannot reliably remove vocals from arbitrary stereo masters. A production AI separator should use an optimized native model runtime (for example ONNX Runtime) and bounded overlap-add inference.
