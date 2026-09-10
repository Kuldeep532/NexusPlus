import type { EPaperDocument, EPaperElement, EPaperPage } from './ePaperTypes';

export type EPaperHistory = { past: EPaperDocument[]; future: EPaperDocument[] };

export function cloneDocument(doc: EPaperDocument): EPaperDocument {
  return JSON.parse(JSON.stringify(doc)) as EPaperDocument;
}

export function pushHistory(history: EPaperHistory, doc: EPaperDocument): EPaperHistory {
  return { past: [...history.past.slice(-39), cloneDocument(doc)], future: [] };
}

export function undo(history: EPaperHistory, current: EPaperDocument): { history: EPaperHistory; document: EPaperDocument } {
  const previous = history.past.at(-1);
  if (!previous) return { history, document: current };
  return { history: { past: history.past.slice(0, -1), future: [cloneDocument(current), ...history.future.slice(0, 39)] }, document: cloneDocument(previous) };
}

export function redo(history: EPaperHistory, current: EPaperDocument): { history: EPaperHistory; document: EPaperDocument } {
  const next = history.future[0];
  if (!next) return { history, document: current };
  return { history: { past: [...history.past.slice(-39), cloneDocument(current)], future: history.future.slice(1) }, document: cloneDocument(next) };
}

export function updateElement(doc: EPaperDocument, pageId: string, elementId: string, patch: Partial<EPaperElement>): EPaperDocument {
  return {
    ...doc,
    pages: doc.pages.map((page) => page.id !== pageId ? page : {
      ...page,
      elements: page.elements.map((element) => element.id !== elementId ? element : ({ ...element, ...patch } as EPaperElement)),
    }),
  };
}

export function deleteElement(doc: EPaperDocument, pageId: string, elementId: string): EPaperDocument {
  return { ...doc, pages: doc.pages.map((page) => page.id === pageId ? { ...page, elements: page.elements.filter((element) => element.id !== elementId) } : page) };
}

export function duplicateElement(doc: EPaperDocument, pageId: string, elementId: string): EPaperDocument {
  return {
    ...doc,
    pages: doc.pages.map((page) => {
      if (page.id !== pageId) return page;
      const source = page.elements.find((element) => element.id === elementId);
      if (!source) return page;
      const copy: EPaperElement = { ...source, id: `${source.id}-copy-${Date.now()}`, x: source.x + 12, y: source.y + 12, zIndex: (source.zIndex ?? 0) + 1 } as EPaperElement;
      return { ...page, elements: [...page.elements, copy] };
    }),
  };
}

export function bringForward(doc: EPaperDocument, pageId: string, elementId: string, direction: 'forward' | 'backward' | 'front' | 'back'): EPaperDocument {
  return {
    ...doc,
    pages: doc.pages.map((page) => {
      if (page.id !== pageId) return page;
      const elements = page.elements.map((element) => {
        if (element.id !== elementId) return element;
        const current = element.zIndex ?? 0;
        const max = Math.max(0, ...page.elements.map((item) => item.zIndex ?? 0));
        const min = Math.min(0, ...page.elements.map((item) => item.zIndex ?? 0));
        const zIndex = direction === 'forward' ? current + 1 : direction === 'backward' ? current - 1 : direction === 'front' ? max + 1 : min - 1;
        return { ...element, zIndex };
      });
      return { ...page, elements };
    }),
  };
}

export function reorderPages(doc: EPaperDocument, fromIndex: number, toIndex: number): EPaperDocument {
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= doc.pages.length || toIndex >= doc.pages.length || fromIndex === toIndex) return doc;
  const pages = [...doc.pages];
  const [page] = pages.splice(fromIndex, 1);
  pages.splice(toIndex, 0, page);
  return { ...doc, pages };
}

export function addPage(doc: EPaperDocument): EPaperDocument {
  const page: EPaperPage = { id: `page-${Date.now()}-${doc.pages.length}`, elements: [], background: doc.background };
  return { ...doc, pages: [...doc.pages, page] };
}
