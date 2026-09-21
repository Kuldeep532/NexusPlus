import * as Sharing from 'expo-sharing';
import { router } from 'expo-router';
import type { DocumentRecord } from './documentTypes';

export async function shareDocument(document: DocumentRecord): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
  await Sharing.shareAsync(document.uri, { dialogTitle: 'Share ' + document.title, mimeType: document.mimeType });
}

export function openDocumentReader(document: DocumentRecord): void {
  router.push({ pathname: '/document-reader', params: { documentId: document.id } });
}

export function openDocumentBookReader(document: DocumentRecord): void {
  router.push({ pathname: '/document-book-reader', params: { documentId: document.id } });
}

export function openDocumentSummarizer(document: DocumentRecord): void {
  router.push({ pathname: '/document-summarizer', params: { documentId: document.id } });
}

export function openDocumentTranslator(document: DocumentRecord): void {
  router.push({ pathname: '/document-translator', params: { documentId: document.id } });
}
