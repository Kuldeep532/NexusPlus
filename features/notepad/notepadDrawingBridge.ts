import { sketchToSvg, type SketchDocument } from '@/features/sketch/sketchEngine';
import { localNotesRepository } from './notepadRepository';
import { addVaultItemWithAuthentication } from '@/features/biometric-vault/secureVaultService';
import type { Note } from './notepadTypes';

export async function saveSketchAsNote(input: { document: SketchDocument; title?: string; categoryId: string; target: 'NOTEPAD' | 'SECURE_VAULT' }): Promise<Note> {
  const svg = sketchToSvg(input.document);
  const now = Date.now();
  const drawingUri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  const note: Note = {
    id: 'drawing-' + now.toString(36) + '-' + Math.random().toString(36).slice(2, 8),
    kind: 'DRAWING',
    title: input.title?.trim() || 'Drawing Note',
    content: '',
    categoryId: input.categoryId,
    attachments: [{
      id: 'drawing-attachment-' + now.toString(36),
      kind: 'DRAWING',
      uri: drawingUri,
      mimeType: 'image/svg+xml',
      name: 'drawing.svg',
      width: input.document.width,
      height: input.document.height,
      metadata: { sketchVersion: input.document.version },
    }],
    createdAt: now,
    updatedAt: now,
    source: 'PAINT_GENERATOR',
  };
  if (input.target === 'NOTEPAD') {
    await localNotesRepository.saveNote(note);
  } else {
    await addVaultItemWithAuthentication({
      category: 'SECURE_NOTE',
      kind: 'DRAWING',
      title: note.title,
      content: drawingUri,
      attachments: [{
        id: 'vault-drawing-' + now.toString(36),
        kind: 'DRAWING',
        uri: drawingUri,
        mimeType: 'image/svg+xml',
        name: 'drawing.svg',
        width: input.document.width,
        height: input.document.height,
      }],
      tags: ['drawing', 'paint-generator'],
      noteCategoryId: input.categoryId,
    }, 'Authenticate to save this drawing in Secure Vault.');
  }
  return note;
}
