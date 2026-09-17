# PDF ⇄ Word native engine contract

The application UI and TypeScript boundary are now registered, but the Android repository currently has PDFBox-backed PDF operations only. No checked-in DOCX conversion engine is present.

Do not generate a placeholder `.docx`/`.pdf` and call the conversion successful. The native implementation must be added before the feature is production-ready:

- `pdfToWord(inputPath, outputPath)`: extract document content/layout into a valid Office Open XML `.docx` package.
- `wordToPdf(inputPath, outputPath)`: parse the `.docx` package and render its document content into a valid PDF.
- Validate input/output paths and reject malformed or unsupported files.
- Keep processing in app-scoped storage and off the UI thread.
- Bound memory/CPU work for large documents and clean partial output files on failure.
- Preserve the current JS error contract so unsupported native builds fail visibly instead of silently succeeding.

The current Android CI workflow already provides clean Expo/Metro/Gradle/CMake workspaces and runs the Android compiler as the authoritative gate. A fresh successful Android build must be run after the native engine is added.
