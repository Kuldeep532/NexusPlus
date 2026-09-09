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

export async function eraseCctvData(
  camera: CctvCameraRecord,
  scope: 'all_recordings' | 'selected_recording',
  recordingToken?: string,
): Promise<void> {
  assertCapability(camera, 'eraseData');
  const { getCctvAdapter } = await import('./cctvBackend');
  const { openCctvSession } = await import('./cctvSession');
  const active = await openCctvSession(camera);
  try {
    await getCctvAdapter(camera.protocol).eraseData(active.context, scope);
    void recordingToken;
  } catch (error) {
    throw error;
  }
}

export function canPlayback(camera: CctvCamera): boolean {
  return camera.capabilities.recordings && camera.capabilities.playback;
}

export function canErase(camera: CctvCamera): boolean {
  return camera.capabilities.recordings && camera.capabilities.eraseData;
}

export function canChangePassword(camera: CctvCamera): boolean {
  return camera.capabilities.passwordChange && Boolean(camera.host && camera.port && camera.securityProfile?.secureTransport && camera.securityProfile.authenticated);
}

export function sanitizePlaybackQuery(query: CctvRecordingSearch): CctvRecordingSearch {
  return validateRecordingSearch({ ...query, limit: query.limit ?? 50 });
}

export type CctvPlaybackCamera = CctvCameraRecord;
