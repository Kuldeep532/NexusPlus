# PDF ⇄ Word

The PDF Tools hub exposes one unified PDF ⇄ Word screen with two directions:

- PDF to Word (`.docx`)
- Word (`.docx`) to PDF

The TypeScript layer intentionally calls an Android-native conversion boundary. The UI does not fabricate output files when the native conversion engine is absent; it reports that the current build does not support the operation.

Production readiness requires a real Android document-conversion engine for both directions and a successful Android build/runtime validation. The current repository inspection connection can update source files and inspect GitHub CI configuration, but cannot execute the Android/EAS build itself.
