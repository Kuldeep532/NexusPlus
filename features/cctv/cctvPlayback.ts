import type { CctvCameraRecord, CctvRecordingItem, CctvRecordingSearch } from './cctvBackend';
import { searchCctvRecordings } from './cctvSession';

export interface CctvPlaybackQuery extends CctvRecordingSearch {
  sort?: 'oldest' | 'newest';
}

export interface CctvPlaybackPage {
  items: CctvRecordingItem[];
  hasMore: boolean;
  nextFrom?: number;
}

export async function loadCctvPlaybackPage(
  camera: CctvCameraRecord,
  query: CctvPlaybackQuery,
): Promise<CctvPlaybackPage> {
  const items = await searchCctvRecordings(camera, query);
  const sorted = [...items].sort((a, b) => {
    const direction = query.sort === 'oldest' ? 1 : -1;
    return direction * (a.startedAt - b.startedAt);
  });
  const limit = query.limit ?? 50;
  return {
    items: sorted.slice(0, limit),
    hasMore: sorted.length > limit,
    nextFrom: sorted.length > 0 ? sorted[sorted.length - 1].endedAt : undefined,
  };
}

export function isRecordingWithinRange(recording: CctvRecordingItem, from: number, to: number): boolean {
  return recording.startedAt < to && recording.endedAt > from;
}
