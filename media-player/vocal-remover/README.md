# Nexus Vocal Remover

The vocal-removal feature is split into contracts, engines, and a job service so the UI never depends on a specific AI runtime.

## Engine strategy

1. `native-ai` is preferred when the Android development build exposes `globalThis.NexusVocalRemover`.
2. `phase-cancel` remains a lightweight compatibility fallback for stereo mixes where vocals are strongly center-panned.
3. The native AI bridge is intentionally runtime-agnostic. The Android implementation can use an ONNX-exported Demucs/MDX model, TensorFlow Lite, or another optimized separator without changing the React Native UI.

For high-quality separation, the recommended model family is Hybrid Demucs. Demucs supports vocals/instrumental separation and offers quantized variants for smaller/faster inference. Keep the model outside the JavaScript bundle when possible and download/cache it through the native model manager.

## Native bridge contract

Expose these methods from the Android development build:

- `isAvailable(): Promise<boolean>`
- `separate(inputUri, outputUri, options, onProgress): Promise<{ outputUri, durationMs? }>`
- `cancel(): Promise<void>`
- `dispose(): Promise<void>`

The native implementation should:

- decode MP3/AAC/FLAC/WAV/OGG to PCM;
- resample to the model's required sample rate;
- process bounded overlapping chunks to control RAM;
- run the selected local separator model;
- reconstruct the requested `vocals` or `instrumental` stem;
- encode to a high-quality local audio file;
- return the actual file URI;
- release native tensors and buffers after every job.

Never upload the user's media or put model/API credentials in the JavaScript bundle.
