import type { EPaperImageElement } from './ePaperTypes';
import { inferSectionId, matchImagesToContent, splitMixedContent, type ContentChunk } from './ePaperMatcher';

export type InputSection = {
  title?: string;
  body: string;
};

export type ClassifiedSection = ContentChunk & {
  sectionId: string;
  score: number;
};

export function normalizeContentInputs(singlePaste: string, separateSections: InputSection[]): ClassifiedSection[] {
  const merged: ContentChunk[] = [];
  if (singlePaste.trim()) merged.push(...splitMixedContent(singlePaste));
  for (let index = 0; index < separateSections.length; index += 1) {
    const item = separateSections[index];
    if (!item.body.trim() && !item.title?.trim()) continue;
    merged.push({ id: `separate-${index + 1}`, title: item.title?.trim() || `Story ${merged.length + 1}`, body: item.body.trim(), source: 'separate-input' });
  }

  const deduped: ContentChunk[] = [];
  const seen = new Set<string>();
  for (const chunk of merged) {
    const key = `${chunk.title}\n${chunk.body}`.replace(/\s+/g, ' ').trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(chunk);
  }
  return deduped.map((chunk) => {
    const inferred = inferSectionId(chunk);
    return { ...chunk, sectionId: inferred.sectionId, score: inferred.score };
  });
}

export type AutoPlacedImage = EPaperImageElement & {
  linkedChunkId?: string;
  linkedSectionId?: string;
  matchScore?: number;
  matchReasons?: string[];
};

export function autoPlaceImages(images: EPaperImageElement[], chunks: ClassifiedSection[]): AutoPlacedImage[] {
  if (!chunks.length) return images;
  const matches = matchImagesToContent(images, chunks);
  return matches.map(({ image, chunkId, sectionId, score, reasons }) => ({
    ...image,
    linkedChunkId: chunkId ?? undefined,
    linkedSectionId: sectionId,
    matchScore: score,
    matchReasons: reasons,
  }));
}

export function groupImagesBySection(images: AutoPlacedImage[]) {
  return images.reduce<Record<string, AutoPlacedImage[]>>((groups, image) => {
    const key = image.linkedSectionId || 'general';
    groups[key] = groups[key] ? [...groups[key], image] : [image];
    return groups;
  }, {});
}
