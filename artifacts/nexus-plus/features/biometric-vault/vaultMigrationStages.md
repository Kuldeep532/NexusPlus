# Nexus Plus native migration stages

The app does not need a full source-code rewrite.

## Stage 1 — Native foundation
Android/iOS build shells, native config, permissions, lifecycle and platform adapter contracts.

## Stage 2 — Security-sensitive features
Biometric Vault, Secure Vault, File Encryption, credential storage, screen protection and native crypto/key storage.

## Stage 3 — Native document/file features
PDF conversion/protection, document picker, storage/content-URI handling, Book Reader and file operations.

## Stage 4 — Native media features
Media Player, Online Radio, Video Editor, Vocal Remover, audio recording/playback and foreground media services.

## Stage 5 — Device-integrated features
Camera/Selfie, Battery Announcer, Time Announcer, notifications, background workers and other system integrations.

## Stage 6 — Navigation/UI consolidation
Remove obsolete preview-only modules, unify native-backed navigation, accessibility and shared React Native UI.

## Stage 7 — Build validation
Android APK/AAB, iOS archive, typecheck, native compilation, permissions and lifecycle regression tests.

Typical scope: roughly 7 major migration stages. The exact count may change as native build errors reveal additional dependencies.
