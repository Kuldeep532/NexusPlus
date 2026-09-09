import { CctvBackendError, assertCapability, getCctvAdapter, type CctvCameraRecord, type CctvRecordingItem, type CctvRecordingSearch, type CctvSession, type CctvTransportContext } from './cctvBackend';
import { upsertCctvCamera } from './cctvRepository';

export interface CctvLiveSession { session: CctvSession; context: CctvTransportContext; live: boolean; recording: boolean; }
const activeSessions = new Map<string, CctvLiveSession>();

async function removeExpired(cameraId: string, active: CctvLiveSession): Promise<void> {
  if (active.session.expiresAt > Date.now()) return;
  activeSessions.delete(cameraId);
  try { await getCctvAdapter(active.context.camera.protocol).disconnect(active.context); } catch { /* expiration cleanup is best effort */ }
}
async function requireActive(cameraId: string): Promise<CctvLiveSession> {
  const active = activeSessions.get(cameraId);
  if (!active) throw new CctvBackendError({ code: 'NOT_FOUND', message: 'CCTV session is no longer active.', retryable: true });
  await removeExpired(cameraId, active);
  const current = activeSessions.get(cameraId);
  if (!current) throw new CctvBackendError({ code: 'NOT_FOUND', message: 'CCTV session is no longer active.', retryable: true });
  return current;
}

export async function openCctvSession(camera: CctvCameraRecord): Promise<CctvLiveSession> {
  const existing = activeSessions.get(camera.id);
  if (existing) {
    await removeExpired(camera.id, existing);
    const current = activeSessions.get(camera.id);
    if (current && current.session.expiresAt > Date.now()) return current;
  }
  const adapter = getCctvAdapter(camera.protocol);
  const context = await adapter.connect({ ...camera, connectionState: 'connecting' });
  context.session.state = 'connected';
  const refreshed: CctvCameraRecord = { ...context.camera, capabilities: context.capabilities, connectionState: 'connected', lastConnectedAt: Date.now(), lastErrorCode: undefined, schemaVersion: 3, updatedAt: Date.now() };
  await upsertCctvCamera(refreshed);
  const value: CctvLiveSession = { session: context.session, context: { ...context, camera: refreshed }, live: false, recording: false };
  activeSessions.set(camera.id, value);
  return value;
}

export async function closeCctvSession(cameraId: string): Promise<void> {
  const active = activeSessions.get(cameraId);
  if (!active) return;
  activeSessions.delete(cameraId);
  try { await getCctvAdapter(active.context.camera.protocol).disconnect(active.context); }
  finally { active.context.nativeSessionId = undefined; active.context.streamUri = undefined; }
}

export async function startCctvLiveView(camera: CctvCameraRecord): Promise<CctvLiveSession> {
  assertCapability(camera, 'liveView');
  const active = await openCctvSession(camera);
  await getCctvAdapter(camera.protocol).startLiveView(active.context);
  active.live = true; active.session.state = 'connected';
  return active;
}
export async function stopCctvLiveView(cameraId: string): Promise<void> {
  const active = await requireActive(cameraId);
  await getCctvAdapter(active.context.camera.protocol).stopLiveView(active.context);
  active.live = false; if (!active.recording) active.session.state = 'connected';
}
export async function startCctvRecording(camera: CctvCameraRecord): Promise<CctvLiveSession> { assertCapability(camera, 'recordings'); const active = await startCctvLiveView(camera); await getCctvAdapter(camera.protocol).startRecording(active.context); active.recording = true; active.session.state = 'recording'; return active; }
export async function stopCctvRecording(cameraId: string): Promise<void> { const active = await requireActive(cameraId); await getCctvAdapter(active.context.camera.protocol).stopRecording(active.context); active.recording = false; active.session.state = 'connected'; }
export async function searchCctvRecordings(camera: CctvCameraRecord, query: CctvRecordingSearch): Promise<CctvRecordingItem[]> { assertCapability(camera, 'playback'); const active = await openCctvSession(camera); return getCctvAdapter(camera.protocol).searchRecordings(active.context, query); }
export function getActiveCctvSession(cameraId: string): CctvLiveSession | null { const active = activeSessions.get(cameraId); if (!active || active.session.expiresAt <= Date.now()) { if (active) void removeExpired(cameraId, active); return null; } return active; }
