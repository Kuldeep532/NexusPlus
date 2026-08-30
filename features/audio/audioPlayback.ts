let soundAvailable = false;

/**
 * Optional document-processing audio cue.
 * The production build no longer bundles a document-processing sound asset,
 * so this is intentionally a no-op while keeping the public API stable.
 */
export async function playDocumentProcessingSound(): Promise<void> {
  if (!soundAvailable) return;
}
