import { sketchToSvg, type SketchDocument } from '@/features/sketch/sketchEngine';
import { localNotesRepository } from './notepadRepository';
import { readVault, writeVault } from '@/features/biometric-vault/biometricVaultRepository';
import type { Note } from './notepadTypes';

export async function saveSketchAsNote(input: { document: SketchDocument; title?: string; categoryId: string; target: 'NOTEPAD' | 'SECURE_VAULT' }): Promise<Note> {
  const svg = sketchToSvg(input.document);
  const now = Date.now();
  const note: Note = {
    id: 'drawing-' + now.toString(36) + '-' + Math.random().toString(36).slice(2, 8),
    kind: 'DRAWING',
    title: input.title?.trim() || 'Drawing Note',
    content: '',
    categoryId: input.categoryId,
    attachments: [{ id: 'drawing-attachment-' + now.toString(36), kind: 'DRAWING', uri: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg), mimeType: 'image/svg+xml', name: 'drawing.svg', width: input.document.width, height: input.document.height, metadata: { sketchVersion: input.document.version } }],
    createdAt: now,
    updatedAt: now,
    source: 'PAINT_GENERATOR',
  };
  if (input.target === 'NOTEPAD') {
    await localNotesRepository.saveNote(note);
  } else {
    const snapshot = await readVault();
    const secureNote = { id: 'secure-drawing-' + now.toString(36), category: 'SECURE_NOTE' as const, title: note.title, content: note.attachments[0].uri, tags: ['drawing', 'paint-generator'], createdAt: now, updatedAt: now };
    await writeVault([secureNote, ...snapshot.items], snapshot.keyVersion);
  }
  return note;
}
