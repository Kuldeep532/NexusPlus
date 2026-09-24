import type { KrishnaLeelaStory } from './krishnaLeelaCatalog';

export const KRISHNA_LEELA_FEED_URL =
  process.env.EXPO_PUBLIC_KRISHNA_LEELA_FEED_URL || '';

export async function loadOnlineKrishnaLeelaStories(): Promise<KrishnaLeelaStory[]> {
  if (!KRISHNA_LEELA_FEED_URL) {
    throw new Error('Online Krishna Leela feed is not configured.');
  }
  const response = await fetch(KRISHNA_LEELA_FEED_URL, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Online story feed returned HTTP ${response.status}`);
  const data: unknown = await response.json();
  if (!Array.isArray(data)) throw new Error('Online story feed must return an array.');
  return data.filter(isStory).map((story) => ({ ...story, sourceType: 'online' as const })).slice(0, 7);
}

function isStory(value: unknown): value is KrishnaLeelaStory {
  if (!value || typeof value !== 'object') return false;
  const story = value as Record<string, unknown>;
  return typeof story.id === 'string' && typeof story.title === 'string' && typeof story.summary === 'string' && typeof story.text === 'string';
}
