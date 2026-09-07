# NexusPlus Production Readiness

This directory tracks staged production-hardening work for NexusPlus.

## Voice and downloaded-asset hardening — completed in the current pass

The voice download and playback paths are now designed to fail safely:

- Voice-library model/config files are downloaded to temporary `.download` paths and published only after both files pass validation.
- Partial downloads are cleaned up instead of being treated as installed voices.
- Duplicate downloads for the same voice/asset are serialized in-process.
- Existing valid voice installs are preserved when a refresh/download attempt fails.
- Voice-library metadata is versioned and migrated from the previous storage key.
- A valid voice file pair can repair missing local metadata without forcing a large re-download.
- Assistant model/voice APIs now use the canonical asset IDs from the catalog instead of hard-coded IDs.
- Assistant asset downloads use temporary files, non-empty-file validation, cleanup, and duplicate-download protection.
- Piper TTS checks that the selected model/config and synthesized WAV are actually usable before creating an audio player.
- Piper failure is fail-safe and returns to the caller so system TTS can be used instead.
- Reminder audio playback catches player creation/output failures and falls back to system TTS.
- Voice Library UI now catches download/remove errors and exposes status through an accessibility live region instead of allowing rejected promises to escape the press handler.

## Important release-gate limitation

The repository still must not be described as fully production-verified until a real Android release build and device-level smoke test have passed. In particular, the current Nexus Assistant native voice module captures PCM but its `speak()` method still reports that the local Piper backend is unavailable, and the local inference engine is currently a safe unavailable stub. The code now fails closed rather than crashing or pretending those backends work.

Before release, verify at minimum:

1. Fresh-install Android launch and navigation.
2. Voice download on good, interrupted, resumed, and low-storage conditions.
3. Corrupt/partial model recovery and reinstall.
4. English and Hindi voice playback plus system-TTS fallback.
5. App background/foreground during download and playback.
6. Reminder voice playback when the native Piper backend is unavailable.
7. Release APK/AAB build with the repository's production workflow.
8. Device smoke tests on multiple Android API levels and at least one low-memory device.

## Existing Stage 1 scope

The repository also contains the earlier Biometric Vault hardening work. The original security principles remain:

- Never treat biometric availability as guaranteed.
- Use device capability checks before presenting biometric actions.
- Keep secrets in secure storage rather than ordinary persistent storage.
- Preserve a safe fallback when the device cannot authenticate biometrically.
- Keep authentication errors user-safe and accessibility-friendly.

All later production-readiness work is intended to be incremental and behavior-preserving unless a production-safety correction requires otherwise.
