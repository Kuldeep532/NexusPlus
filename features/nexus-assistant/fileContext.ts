import { Platform } from 'react-native';
import type { DocumentDescriptor } from '@/features/document-reader/documentReaderTypes';
import { readDocumentText } from '@/features/document-reader/documentReaderBackend';

export type AssistantFileContext = {
  name: string;
  format: DocumentDescriptor['format'];
  sizeBytes?: number;
  text: string;
  truncated: boolean;
};

const MAX_CONTEXT_CHARS = 60_000;

function normalizeText(value: string): string {
  return value.replace(/\u0000/g, '').replace(/[ \t]+\n/g, '\n').trim();
}

export async function buildAssistantFileContext(document: DocumentDescriptor): Promise<AssistantFileContext> {
  if (Platform.OS !== 'android') {
    throw new Error('File text extraction is currently available through the Android reader backend.');
  }

  const raw = normalizeText(await readDocumentText(document));
  if (!raw) throw new Error('No readable text was found in this file.');

  return {
    name: document.name,
    format: document.format,
    sizeBytes: document.sizeBytes,
    text: raw.slice(0, MAX_CONTEXT_CHARS),
    truncated: raw.length > MAX_CONTEXT_CHARS,
  };
}

export function formatFileContextForAssistant(context: AssistantFileContext): string {
  const truncation = context.truncated
    ? '\n[Only the first portion of the extracted text is included. Do not assume unseen content.]'
    : '';
  return [
    `File: ${context.name}`,
    `Format: ${context.format}`,
    context.sizeBytes ? `Size: ${context.sizeBytes} bytes` : null,
    'Extracted text:',
    context.text,
    truncation,
  ].filter(Boolean).join('\n');
}
