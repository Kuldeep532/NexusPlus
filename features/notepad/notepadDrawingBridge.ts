import { sketchToSvg, type SketchDocument } from '@/features/sketch/sketchEngine';
import { persistAttachment } from './notepadAttachmentStore';
import { localNotesRepository } from './notepadRepository';
import type { Note } from './notepadTypes';

export async function saveSketchAsNote(input: { document: SketchDocument; title?: string; categoryId: string; secure?: boolean }): Promise<Note> {
  const svg = sketchToSvg(input.document);
  const encoded = encodeURIComponent(svg);
  const uri = `data:image/svg+xml;charset=utf-8,${encoded}`;
  const now = Date.now();
  const note: Note = {
    id: `drawing-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    kind: 'DRAWING',
    title: input.title?.trim() || 'Drawing Note',
    content: '',
    categoryId: input.categoryId,
    attachments: [{ id: `drawing-attachment-${now.toString(36)}`, kind: 'DRAWING', uri, mimeType: 'image/svg+xml', name: 'drawing.svg', width: input.document.width, height: input.document.height, metadata: { sketchVersion: input.document.version } }],
    createdAt: now,
    updatedAt: now,
    source: 'PAINT_GENERATOR',
  };
  await localNotesRepository.saveNote(note);
  return note;
}
