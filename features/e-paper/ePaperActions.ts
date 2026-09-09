import AsyncStorage from '@react-native-async-storage/async-storage';
import type { EPaperDocument, EPaperElement } from './ePaperTypes';

const KEY = 'nexusplus.epaper.projects.v1';

export async function saveEPaperProject(doc: EPaperDocument): Promise<void> {
  const raw = await AsyncStorage.getItem(KEY);
  const projects: Record<string, EPaperDocument> = raw ? JSON.parse(raw) : {};
  projects[doc.title || 'My E-Paper'] = doc;
  await AsyncStorage.setItem(KEY, JSON.stringify(projects));
}

export async function loadEPaperProjects(): Promise<EPaperDocument[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  const projects: Record<string, EPaperDocument> = JSON.parse(raw);
  return Object.values(projects);
}

export function updateElement(doc: EPaperDocument, pageId: string, elementId: string, patch: Partial<EPaperElement>): EPaperDocument {
  return {
    ...doc,
    pages: doc.pages.map((page) => page.id !== pageId ? page : {
      ...page,
      elements: page.elements.map((element) => element.id === elementId ? ({ ...element, ...patch } as EPaperElement) : element),
    }),
  };
}

export function deleteElement(doc: EPaperDocument, pageId: string, elementId: string): EPaperDocument {
  return {
    ...doc,
    pages: doc.pages.map((page) => page.id !== pageId ? page : { ...page, elements: page.elements.filter((element) => element.id !== elementId) }),
  };
}

export function duplicatePage(doc: EPaperDocument, pageId: string): EPaperDocument {
  const source = doc.pages.find((page) => page.id === pageId);
  if (!source) return doc;
  const copy = { id: `${pageId}-copy-${Date.now()}`, elements: source.elements.map((element) => ({ ...element, id: `${element.id}-copy-${Date.now()}` })) };
  const index = doc.pages.findIndex((page) => page.id === pageId);
  return { ...doc, pages: [...doc.pages.slice(0, index + 1), copy, ...doc.pages.slice(index + 1)] };
}
