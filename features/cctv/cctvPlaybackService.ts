import type { CctvCamera } from './cctvTypes';
import { assertCapability, validateRecordingSearch, type CctvCameraRecord, type CctvRecordingItem, type CctvRecordingSearch } from './cctvBackend';
import { searchCctvRecordings } from './cctvSession';

export async function searchCctvRecordingsForCamera(
  camera: CctvCameraRecord,
  query: CctvRecordingSearch,
): Promise<CctvRecordingItem[]> {
  const validated = validateRecordingSearch(query);
  assertCapability(camera, 'recordings');
  assertCapability(camera, 'playback');
  return searchCctvRecordings(camera, validated);
}

export function canPlayback(camera: CctvCamera): boolean {
  return camera.capabilities.recordings && camera.capabilities.playback;
}

export function sanitizePlaybackQuery(query: CctvRecordingSearch): CctvRecordingSearch {
  return validateRecordingSearch({ ...query, limit: query.limit ?? 50 });
}

export type CctvPlaybackCamera = CctvCameraRecord;
