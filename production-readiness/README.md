# NexusPlus Production Readiness

This directory tracks the staged production-hardening work for NexusPlus.

## Stage 1: Biometric Vault

The repository already declares `expo-local-authentication` and `expo-secure-store` in the Expo configuration. Stage 1 will harden the existing Biometric Vault implementation without changing unrelated feature behavior.

Principles:

- Never treat biometric availability as guaranteed.
- Use device capability checks before presenting biometric actions.
- Keep secrets in secure storage rather than ordinary persistent storage.
- Preserve a safe fallback when the device cannot authenticate biometrically.
- Keep all authentication errors user-safe and accessibility-friendly.

All later production-readiness stages are intended to land in the same long-lived PR.
