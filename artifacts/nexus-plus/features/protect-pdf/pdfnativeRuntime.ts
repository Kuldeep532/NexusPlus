/**
 * Legacy pdfnative runtime marker.
 *
 * Android Stage 2 now uses the shared NexusPdfNative React Native module
 * backed by PDFBox-Android. This file intentionally keeps the legacy
 * runtime import isolated so iOS or a future alternate PDF backend can be
 * restored without changing Protect-PDF business logic.
 */
export {};
