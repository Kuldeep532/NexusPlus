import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import type { DocumentRecord } from './documentTypes';
import { readDocumentText } from '@/features/document-reader/documentReaderBackend';
import type { DocumentDescriptor } from '@/features/document-reader/documentReaderTypes';

export async function ensureDocumentText(document: DocumentRecord): Promise<string> {
  if (document.textPreview && document.textPreview.length > 120) return document.textPreview;
  const descriptor: DocumentDescriptor = {
    uri: document.uri,
    name: document.title,
    mimeType: document.mimeType,
    format: document.format as DocumentDescriptor['format'],
    sizeBytes: document.sizeBytes,
  };
  if (document.format === 'txt' || document.format === 'md') {
    return FileSystem.readAsStringAsync(document.uri, { encoding: FileSystem.EncodingType.UTF8 });
  }
  if (Platform.OS === 'android') return readDocumentText(descriptor);
  throw new Error('Text extraction for this document requires the Android document reader engine.');
}
