import type { CctvCamera } from './cctvTypes';
import { assertCapability, getCctvAdapter, validateRecordingSearch, type CctvCameraRecord, type CctvRecordingItem, type CctvRecordingSearch } from './cctvBackend';
import type { CctvLiveSession } from './cctvSessionService';

export async function searchCctvRecordings(
  live: CctvLiveSession,
  query: CctvRecordingSearch,
): Promise<CctvRecordingItem[]> {
  validateRecordingSearch(query);
  assertCapability(live.camera, 'recordings');
  assertCapability(live.camera, 'playback');
  const adapter = getCctvAdapter(live.camera.protocol);
  const context = await adapter.connect(live.camera);
  try {
    return await adapter.searchRecordings(context, query);
  } finally {
    await adapter.disconnect(context);
  }
}

export async function eraseCctvData(
  live: CctvLiveSession,
  scope: 'all_recordings' | 'selected_recording',
): Promise<void> {
  assertCapability(live.camera, 'eraseData');
  const adapter = getCctvAdapter(live.camera.protocol);
  const context = await adapter.connect(live.camera);
  try {
    await adapter.eraseData(context, scope);
  } finally {
    await adapter.disconnect(context);
  }
}

export function canPlayback(camera: CctvCamera): boolean {
  return camera.capabilities.recordings && camera.capabilities.playback;
}

export function canErase(camera: CctvCamera): boolean {
  return camera.capabilities.recordings && camera.capabilities.eraseData;
}

export function canChangePassword(camera: CctvCamera): boolean {
  return camera.capabilities.passwordChange && Boolean(camera.host && camera.port);
}

export function sanitizePlaybackQuery(query: CctvRecordingSearch): CctvRecordingSearch {
  return validateRecordingSearch({ ...query, limit: query.limit ?? 50 });
}

export type CctvPlaybackCamera = CctvCameraRecord;
