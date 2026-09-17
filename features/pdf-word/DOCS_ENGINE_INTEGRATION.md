# Docs Engine Integration — Stage Plan

Issue #79 tracks the Android document engine work. All changes stay on `main`; no new branch is created.

## Stage 1 — Engine selection

Current native PDF work uses PDFBox for PDF operations, but PDFBox is not a DOCX conversion engine. A production PDF ⇄ Word implementation therefore requires a separate document engine.

Candidate assessment:

- **Apryse Mobile SDK**: provides direct MS Office conversion on Android, including DOCX to PDF, without Microsoft Office and without an external conversion server. Production use requires a commercial license.
- **Collabora/LibreOfficeKit**: has a real LibreOffice-derived document engine on Android and supports DOCX, but embedding the native engine requires a substantially heavier native build/integration surface and NDK/toolchain work.
- **Apache POI**: handles OOXML/DOCX parsing and generation, but it is not a complete DOCX-to-PDF rendering engine. It cannot by itself satisfy both conversion directions with Word-compatible layout fidelity.

## Stage 2 — Native boundary

The JS layer exposes `isDocumentEngineAvailable`, `pdfToWord`, and `wordToPdf` through `NexusPdfNative`. Missing engine methods must fail explicitly; no placeholder output is permitted.

## Stage 3 — Engine adapter

Add exactly one concrete adapter behind `NexusPdfNative` once the engine artifact and license/build requirements are available. Keep file validation, app-scoped output paths, cleanup and React Native Promise handling outside the vendor-specific adapter where practical.

## Stage 4 — Conversion implementation

Implement real PDF-to-DOCX and DOCX-to-PDF conversion. Conversion must run off the UI thread, validate input/output paths, bound document/resource sizes, close all streams/handles, and remove partial outputs on failure.

## Stage 5 — Validation

Run the repository Android workflow and verify a fresh APK/AAB. Exercise valid PDF, malformed PDF, valid DOCX, malformed DOCX, large-file/error paths, and both conversion directions. Only after those checks should Issue #79 be considered production-ready.

## Current decision gate

Do not add a commercial document engine dependency with a fake/public license key. A real production engine requires either the user's approved commercial license/configuration or an open-source engine that can be pinned and built within the repository's Android toolchain. Until that gate is satisfied, the app must continue reporting the feature as unavailable rather than generating fake files.
