export interface GeetaFirebaseAsset {
  id: string;
  chapter?: number;
  kind: 'chapter-summary-audio' | 'verse-audio' | 'text' | 'metadata';
  storagePath: string;
  filename?: string;
}

/**
 * Firebase Storage manifest contract.
 * Keep Firebase paths stable; the app resolves only paths from this manifest.
 * Audio is intentionally chapter/verse scoped so the downloader can fetch only what is needed.
 */
export const GITA_FIREBASE_ASSETS: GeetaFirebaseAsset[] = [
  {
    id: 'gita-dhyanam',
    kind: 'metadata',
    storagePath: 'geeta-nexus/metadata/gita-dhyanam.json',
  },
  {
    id: 'chapters-metadata',
    kind: 'metadata',
    storagePath: 'geeta-nexus/metadata/chapters.json',
  },
  {
    id: 'verses',
    kind: 'text',
    storagePath: 'geeta-nexus/text/verse.json',
    filename: 'verse.json',
  },
  {
    id: 'translations',
    kind: 'text',
    storagePath: 'geeta-nexus/text/translation.json',
    filename: 'translation.json',
  },
  {
    id: 'summaries',
    kind: 'text',
    storagePath: 'geeta-nexus/text/chapters_summary2.json',
    filename: 'chapters_summary2.json',
  },
  ...Array.from({ length: 18 }, (_, index) => ({
    id: `chapter-${index + 1}-summary-audio`,
    chapter: index + 1,
    kind: 'chapter-summary-audio' as const,
    storagePath: `geeta-nexus/audio/chapters_summary/${index + 1}.mpga`,
    filename: `${index + 1}.mpga`,
  })),
];

export function getChapterSummaryAudioAsset(chapter: number): GeetaFirebaseAsset | null {
  return GITA_FIREBASE_ASSETS.find(
    (asset) => asset.chapter === chapter && asset.kind === 'chapter-summary-audio',
  ) ?? null;
}

export function getFirebaseAsset(id: string): GeetaFirebaseAsset | null {
  return GITA_FIREBASE_ASSETS.find((asset) => asset.id === id) ?? null;
}
