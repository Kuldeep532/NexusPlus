# Docs Engine Integration — Production Status

Issue #79 covers Android PDF ⇄ DOCX conversion. All changes stay on `main`; no new branch is required.

## Engine

Nexus Plus uses LibreOfficeKit (LOK) as the document conversion engine. LibreOffice's Android implementation bundles the LibreOffice core as `liblo-native-code.so`; this is the native engine used by the Android application.

## Adapter boundary

The React Native layer calls `NexusPdfNative.isDocsEngineAvailable`, `pdfToWord`, and `wordToPdf`. The Kotlin `DocsEngineAdapter` owns validation and delegates conversion to `LibreOfficeEngine`; partial outputs are removed on failure.

## Required Android native payload

The APK must contain the LibreOfficeKit native payload for every supported ABI, including `liblo-native-code.so`, its required native dependencies, and the LibreOffice runtime assets/data required by that engine build.

The JNI loader deliberately fails closed when the payload is missing. It must never create renamed files, empty documents, or other placeholder output.

## Engine build

The normal Android Gradle/CMake build does not compile LibreOffice itself. A production build therefore needs a reproducible engine-artifact step that pins the LibreOffice source revision, builds the Android engine with the supported NDK/toolchain, places the ABI-specific native libraries and runtime assets into Android packaging inputs, and verifies the required payload before Gradle assembles the APK/AAB.

LibreOffice's upstream Android documentation documents the Android LOK architecture and the bundled `liblo-native-code.so` engine.

## Conversion requirements

- PDF → DOCX creates a valid Office Open XML `.docx` package using the real document engine.
- DOCX → PDF renders the document using the real document engine.
- Conversion runs off the Android UI thread.
- Inputs are limited to 50 MB by the app adapter.
- Input/output paths are validated and outputs stay in app-scoped storage.
- Partial output is removed on conversion failure.
- Malformed and unsupported inputs fail visibly.

## Validation

The feature is production-complete only after the engine artifact is actually present, a fresh Android build passes, and both directions plus malformed/large-input error paths are exercised successfully.
