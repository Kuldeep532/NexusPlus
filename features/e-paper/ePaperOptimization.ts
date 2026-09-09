import type { EPaperDocument, EPaperElement } from './ePaperTypes';
import { detectGeneratedLikeLayout, optimizeEpaperLocally, type EPaperOptimizationReport } from './ePaperOptimizer';

export type ImportedPaperAnalysis = EPaperOptimizationReport & { document: EPaperDocument };

export function analyzeImportedEpaper(doc: EPaperDocument): ImportedPaperAnalysis {
  const report = detectGeneratedLikeLayout(doc);
  return { ...report, document: doc };
}

export function oneClickHumanizeEpaper(doc: EPaperDocument): ImportedPaperAnalysis {
  const result = optimizeEpaperLocally(doc);
  return { ...result.report, document: result.document };
}

export function cleanupElementForImport(element: EPaperElement): EPaperElement {
  return {
    ...element,
    opacity: Math.min(1, Math.max(0, element.opacity ?? 1)),
    rotation: Number.isFinite(element.rotation ?? 0) ? element.rotation : 0,
    visible: element.visible !== false,
    zIndex: Number.isFinite(element.zIndex ?? 0) ? element.zIndex : 0,
  };
}
