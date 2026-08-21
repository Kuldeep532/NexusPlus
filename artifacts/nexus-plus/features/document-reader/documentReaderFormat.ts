import type { DocumentDescriptor, DocumentFormat } from './documentReaderTypes';

function extensionOf(name: string): string {
  const match = /\.([a-z0-9]+)$/i.exec(name);
  return match?.[1]?.toLowerCase() ?? '';
}

const EXTENSION_TO_FORMAT: Record<string, DocumentFormat> = {
  pdf: 'pdf',
  epub: 'epub',
  txt: 'txt',
  text: 'txt',
  md: 'md',
  markdown: 'md',
  html: 'html',
  htm: 'html',
  xhtml: 'html',
  rtf: 'rtf',
  docx: 'docx',
  doc: 'doc',
  odt: 'odt',
};

export function detectDocumentFormat(name: string, mimeType?: string): DocumentFormat {
  const extension = extensionOf(name);
  if (extension in EXTENSION_TO_FORMAT) return EXTENSION_TO_FORMAT[extension];

  if (mimeType) {
    const normalized = mimeType.toLowerCase().split(';', 1)[0].trim();
    const mimeMap: Record<string, DocumentFormat> = {
      'application/pdf': 'pdf',
      'application/epub+zip': 'epub',
      'text/plain': 'txt',
      'text/markdown': 'md',
      'text/html': 'html',
      'application/xhtml+xml': 'html',
      'application/rtf': 'rtf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/msword': 'doc',
      'application/vnd.oasis.opendocument.text': 'odt',
    };
    if (normalized in mimeMap) return mimeMap[normalized];
  }

  return 'unsupported';
}

export function describeDocument(uri: string, name: string, mimeType?: string, sizeBytes?: number): DocumentDescriptor {
  return { uri, name, mimeType, format: detectDocumentFormat(name, mimeType), sizeBytes };
}
