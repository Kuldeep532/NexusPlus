import type { DocumentDescriptor } from '../document-reader/documentReaderTypes';
import { readDocumentText } from '../document-reader/documentReaderBackend';

export type BookAssistantContext = {
  documentId: string;
  title: string;
  format: DocumentDescriptor['format'];
  text: string;
  truncated: boolean;
};

const MAX_CONTEXT_CHARS = 60_000;

function documentId(document: DocumentDescriptor): string {
  return `${document.name}:${document.uri}`;
}

export async function buildBookAssistantContext(document: DocumentDescriptor): Promise<BookAssistantContext> {
  const text = (await readDocumentText(document)).replace(/\s+/g, ' ').trim();
  const truncated = text.length > MAX_CONTEXT_CHARS;
  return {
    documentId: documentId(document),
    title: document.name,
    format: document.format,
    text: truncated ? text.slice(0, MAX_CONTEXT_CHARS) : text,
    truncated,
  };
}

export function isBookQuestion(text: string): boolean {
  return /\b(this book|the book|chapter|author|character|plot|theme|summari[sz]e|summary|explain this book|what happens)\b|इस किताब|इस पुस्तक|अध्याय|लेखक|चरित्र|कहानी|सारांश|समझाओ/i.test(text);
}

export function buildBookPrompt(userText: string, context: BookAssistantContext): string {
  const truncationNote = context.truncated
    ? '\nNote: only the first part of this book is in the local context. Say so before answering questions that may require later chapters.'
    : '';
  return [
    `Current book: ${context.title}`,
    `Format: ${context.format}`,
    'Answer the user using the supplied book text as the primary source. Do not invent details not supported by the text.',
    truncationNote,
    `Book text:\n${context.text}`,
    `User request:\n${userText}`,
  ].join('\n\n');
}
