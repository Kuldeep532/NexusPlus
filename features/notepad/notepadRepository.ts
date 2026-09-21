import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Note, NoteCategory } from './notepadTypes';

const NOTES_KEY = 'nexusplus.notes.v1';
const CATEGORIES_KEY = 'nexusplus.note-categories.v1';

export interface NotesRepository {
  listNotes(): Promise<Note[]>;
  saveNote(note: Note): Promise<void>;
  deleteNote(id: string): Promise<void>;
  listCategories(): Promise<NoteCategory[]>;
  saveCategory(category: NoteCategory): Promise<void>;
  deleteCategory(id: string): Promise<void>;
}

export const localNotesRepository: NotesRepository = {
  async listNotes() {
    const raw = await AsyncStorage.getItem(NOTES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed as Note[] : [];
  },
  async saveNote(note) {
    const notes = await this.listNotes();
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify([note, ...notes.filter((item) => item.id !== note.id)]));
  },
  async deleteNote(id) {
    const notes = await this.listNotes();
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes.filter((item) => item.id !== id)));
  },
  async listCategories() {
    const raw = await AsyncStorage.getItem(CATEGORIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed as NoteCategory[] : [];
  },
  async saveCategory(category) {
    const categories = await this.listCategories();
    await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify([category, ...categories.filter((item) => item.id !== category.id)]));
  },
  async deleteCategory(id) {
    const categories = await this.listCategories();
    await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories.filter((item) => item.id !== id)));
  },
};

export const NOTES_STORAGE_LOCATION = 'Nexus Plus / Notes';
