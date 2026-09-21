import type { SacredTextId } from './geetaReadingProgress';

export type SacredTextDefinition = {
  id: SacredTextId;
  title: string;
  shortTitle: string;
  chapterCount: number;
  available: boolean;
  description: string;
};

export const SACRED_TEXTS: SacredTextDefinition[] = [
  {
    id: 'bhagavad-gita',
    title: 'Bhagavad Gita',
    shortTitle: 'Gita',
    chapterCount: 18,
    available: true,
    description: '18 chapters with verse-based offline reading support.',
  },
  {
    id: 'ramcharitmanas',
    title: 'Ramcharitmanas',
    shortTitle: 'Ramcharitmanas',
    chapterCount: 0,
    available: false,
    description: 'Content source is not bundled yet; the selector remains ready without pretending the library is available.',
  },
];
