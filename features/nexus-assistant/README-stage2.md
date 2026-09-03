# Nexus Assistant — Stage 2

Stage 2 adds the application-level local inference boundary while keeping the heavy native runtime and model weights outside the APK.

## Guarantees

- Chat text stays in the local SQLite store when local mode is used.
- The assistant has a streaming token contract so UI can render partial responses immediately.
- The JavaScript layer does not implement model inference.
- Model loading and unloading are explicit, so a downloaded model can later be deleted without changing chat data.
- Context is intentionally bounded to keep latency and memory use predictable.
- The default generation budget is small (`192` tokens, `1024` context) for fast mobile interaction.

## Stage 2 native implementation

The next native implementation should expose `LocalInferenceEngine` through a small Android bridge. The preferred backend should support a compact GGUF/other mobile-optimized format, streaming decode, cancellation, CPU-first execution, and hardware-aware thread limits.

The native module must never upload prompt text or generated tokens. Any remote/cloud provider belongs outside the local engine and must be explicitly separated in a later stage.

## APK size

No model weights or voice binaries are added here. The Stage 2 bridge itself should remain small enough that the production APK stays below the 150 MB product limit.
