export type NoteKind = 'TEXT' | 'IMAGE' | 'AUDIO' | 'DRAWING' | 'MIXED';

export type NoteCategory = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
};

export interface NoteAttachment {
  id: string;
  kind: Exclude<NoteKind, 'TEXT' | 'MIXED'>;
  uri: string;
  mimeType?: string;
  name?: string;
  durationMs?: number;
  width?: number;
  height?: number;
  metadata?: Record<string, string | number | boolean>;
}

export interface Note {
  id: string;
  kind: NoteKind;
  title: string;
  content: string;
  categoryId: string;
  attachments: NoteAttachment[];
  createdAt: number;
  updatedAt: number;
  favorite?: boolean;
  archived?: boolean;
  source?: 'NOTEPAD' | 'PAINT_GENERATOR' | 'VOICE_TYPER' | 'IMPORTED';
}

export const DEFAULT_NOTE_CATEGORIES: NoteCategory[] = [
  { id: 'personal', name: 'Personal', createdAt: 0, updatedAt: 0 },
  { id: 'work', name: 'Work', createdAt: 0, updatedAt: 0 },
  { id: 'ideas', name: 'Ideas', createdAt: 0, updatedAt: 0 },
  { id: 'learning', name: 'Learning', createdAt: 0, updatedAt: 0 },
];
