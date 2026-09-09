import type { EPaperDocument, EPaperElement, EPaperTextElement } from './ePaperTypes';
import { getPaperPoints } from './ePaperTypes';

export type EPaperOptimizationReport = {
  likelyGenerated: boolean;
  score: number;
  reasons: string[];
  changes: string[];
};

function area(element: EPaperElement): number { return Math.max(0, element.width) * Math.max(0, element.height); }

export function detectGeneratedLikeLayout(doc: EPaperDocument): EPaperOptimizationReport {
  const paper = getPaperPoints(doc);
  const all = doc.pages.flatMap((page) => page.elements);
  const text = all.filter((element): element is EPaperTextElement => 'text' in element);
  const reasons: string[] = [];
  let score = 0;
  const pageArea = paper.width * paper.height;
  const tiny = all.filter((element) => area(element) < pageArea * 0.002).length;
  if (tiny > Math.max(3, all.length * 0.2)) { score += 20; reasons.push('Many unusually small elements'); }
  const offGrid = all.filter((element) => Math.abs(element.x % 2) > 0.15 || Math.abs(element.y % 2) > 0.15).length;
  if (offGrid > all.length * 0.65) { score += 15; reasons.push('Irregular element alignment'); }
  const textSizes = new Set(text.map((element) => Math.round(element.fontSize * 10) / 10));
  if (textSizes.size > 9) { score += 15; reasons.push('Excessive typography fragmentation'); }
  const rotations = all.filter((element) => Math.abs(element.rotation ?? 0) > 0.01).length;
  if (rotations > 0) { score += Math.min(10, rotations * 2); reasons.push('Unnecessary rotated elements'); }
  const hidden = all.filter((element) => element.visible === false).length;
  if (hidden > 0) { score += 5; reasons.push('Hidden/stale elements present'); }
  return { likelyGenerated: score >= 35, score, reasons, changes: [] };
}

export function optimizeEpaperLocally(doc: EPaperDocument): { document: EPaperDocument; report: EPaperOptimizationReport } {
  const report = detectGeneratedLikeLayout(doc);
  const changes: string[] = [];
  const normalize = (element: EPaperElement): EPaperElement => {
    if (element.visible === false) return { ...element };
    const next: EPaperElement = { ...element };
    next.x = Math.max(doc.margin, Math.round(next.x * 2) / 2);
    next.y = Math.max(doc.margin, Math.round(next.y * 2) / 2);
    next.width = Math.max(8, Math.round(next.width * 2) / 2);
    next.height = Math.max(8, Math.round(next.height * 2) / 2);
    next.opacity = Math.min(1, Math.max(0, next.opacity ?? 1));
    next.rotation = Math.abs(next.rotation ?? 0) < 1 ? 0 : next.rotation;
    if ('lineHeight' in next) next.lineHeight = Math.max(next.fontSize, Math.round(next.lineHeight));
    return next;
  };
  const pages = doc.pages.map((page) => ({ ...page, elements: page.elements.filter((element) => element.visible !== false).map(normalize) }));
  if (pages.some((page, index) => page.elements.length !== doc.pages[index].elements.length)) changes.push('Removed hidden/stale elements from the editable layout');
  if (pages.some((page, index) => page.elements.some((element, i) => element !== doc.pages[index].elements[i]))) changes.push('Normalized spacing, geometry and typography values');
  const orderedPages = pages.map((page) => ({ ...page, elements: [...page.elements].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)) }));
  changes.push('Re-established deterministic z-order');
  const nextReport = { ...report, changes };
  return { document: { ...doc, pages: orderedPages }, report: nextReport };
}
