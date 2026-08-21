import { Platform, NativeModules } from 'react-native';
import type { DocumentDescriptor, ReaderBookmark, ReaderPosition } from './documentReaderTypes';
import { PdfNativeBridge } from '../pdf-native/PdfNativeBridge';

type NativeReaderApi = {
  isAvailable(): Promise<boolean>;
  extractText(inputPath: string, format: string): Promise<string>;
  listChapters(inputPath: string): Promise<Array<{ id: string; title: string; href: string }>>;
};

const nativeReader = NativeModules.NexusDocumentReader as NativeReaderApi | undefined;

export async function readDocumentText(document: DocumentDescriptor): Promise<string> {
  if (document.format === 'pdf') {
    throw new Error('PDF text extraction should use the paginated native PDF viewer path.');
  }
  if (Platform.OS === 'android' && nativeReader) {
    return nativeReader.extractText(document.uri, document.format);
  }
  throw new Error(`Document text backend is unavailable for ${document.format} on ${Platform.OS}.`);
}

export async function listDocumentChapters(document: DocumentDescriptor) {
  if (document.format === 'epub' && Platform.OS === 'android' && nativeReader) {
    return nativeReader.listChapters(document.uri);
  }
  return [];
}

export async function isDocumentReaderNativeAvailable(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    return Boolean(nativeReader && await nativeReader.isAvailable());
  } catch {
    return false;
  }
}

export type ReaderPersistence = {
  getPosition(documentId: string): Promise<ReaderPosition | null>;
  savePosition(position: ReaderPosition): Promise<void>;
  listBookmarks(documentId: string): Promise<ReaderBookmark[]>;
  saveBookmark(bookmark: ReaderBookmark): Promise<void>;
};

export const NativePdfViewer = {
  available: PdfNativeBridge.isAvailable,
};
