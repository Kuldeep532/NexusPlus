# E-Paper Generator Studio

This feature is intentionally deterministic and AI-independent.

## Architecture

- `ePaperTypes.ts` defines a resolution-independent publication model using point-based page coordinates.
- `ePaperEngine.ts` performs deterministic column layout and pagination.
- `ePaperActions.ts` contains element editing helpers for future direct manipulation UI.
- `ePaperProject.ts` persists projects locally through AsyncStorage.
- `ePaperRenderer.ts` produces standards-based SVG page output suitable for a native raster/PDF pipeline.
- `app/e-paper-generator.tsx` is the accessible Studio UI and responsive preview.

The generated document is independent of device screen size: page geometry is defined in PDF points, while preview scales to available viewport width.

## Export note

The current Nexus Plus native PDF C++ implementation exposes an `imageToPdf` contract, but the checked-in native methods are still unavailable stubs. Therefore this Studio does not pretend that PDF/print export is complete on builds that do not have the native PDF backend linked. Once that native raster/PDF renderer is linked, the SVG page renderer can be connected without changing the document model or layout engine.
