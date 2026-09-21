export type DocumentStudioTool = {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: string;
};

export const DOCUMENT_STUDIO_TOOLS: DocumentStudioTool[] = [
  { id: 'document-creator', title: 'Document Creator', description: 'Create documents and save them automatically to the Document Studio library.', route: '/document-creator', icon: 'file-plus' },
  { id: 'document-library', title: 'Document Library', description: 'Browse, search and manage every document created or imported into Document Studio.', route: '/document-library', icon: 'folder' },
  { id: 'document-reader', title: 'Document Reader', description: 'Read supported documents, continue where you stopped and access document actions.', route: '/document-reader', icon: 'book-open' },
  { id: 'document-book-reader', title: 'Book Reader', description: 'Read document text with the existing accessible reader and voice engine.', route: '/document-book-reader', icon: 'book' },
  { id: 'document-summarizer', title: 'Document Summarizer', description: 'Extract document text and create a concise summary with clear next actions.', route: '/document-summarizer', icon: 'file-text' },
  { id: 'document-translator', title: 'Document Translator', description: 'Translate extracted document text using device-available language translation when supported.', route: '/document-translator', icon: 'globe' },
  { id: 'document-scanner', title: 'Document Scanner', description: 'Capture multiple paper pages and save a real multi-page PDF into the library.', route: '/document-scanner', icon: 'camera' },
  { id: 'document-importer', title: 'Import Document', description: 'Import PDF, EPUB, TXT, Markdown, HTML, RTF, DOCX and supported document formats.', route: '/document-importer', icon: 'upload' },
];
