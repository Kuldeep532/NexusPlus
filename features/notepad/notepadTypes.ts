export type NoteCategory = {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
};

export interface Note {
  id: string;
  title: string;
  description: string;
  content: string;
  categoryId: string;
  createdAt: number;
  updatedAt: number;
  favorite?: boolean;
  archived?: boolean;
}

export const DEFAULT_NOTE_CATEGORIES: NoteCategory[] = [
  { id: 'personal', name: 'Personal', description: 'Personal notes and ideas', createdAt: 0, updatedAt: 0 },
  { id: 'work', name: 'Work', description: 'Work, projects and tasks', createdAt: 0, updatedAt: 0 },
  { id: 'ideas', name: 'Ideas', description: 'Ideas and quick thoughts', createdAt: 0, updatedAt: 0 },
  { id: 'learning', name: 'Learning', description: 'Study and reference notes', createdAt: 0, updatedAt: 0 },
];
