import {
  CctvBackendError,
  assertCapability,
  createSession,
  getCctvAdapter,
  type CctvCameraRecord,
  type CctvRecordingItem,
  type CctvRecordingSearch,
  type CctvSession,
  type CctvTransportContext,
} from './cctvBackend';

export interface CctvLiveSession {
  session: CctvSession;
  context: CctvTransportContext;
  live: boolean;
  recording: boolean;
}

const activeSessions = new Map<string, CctvLiveSession>();

function requireActive(cameraId: string): CctvLiveSession {
  const active = activeSessions.get(cameraId);
  if (!active || active.session.expiresAt <= Date.now()) {
    activeSessions.delete(cameraId);
    throw new CctvBackendError({ code: 'NOT_FOUND', message: 'CCTV session is no longer active.', retryable: true });
  }
  return active;
}

export async function openCctvSession(camera: CctvCameraRecord): Promise<CctvLiveSession> {
  const existing = activeSessions.get(camera.id);
  if (existing && existing.session.expiresAt > Date.now()) return existing;

  const adapter = getCctvAdapter(camera.protocol);
  const session = createSession(camera.id);
  const context = await adapter.connect({ ...camera, connectionState: 'connecting' });
  const value: CctvLiveSession = { session, context, live: false, recording: false };
  activeSessions.set(camera.id, value);
  return value;
}

export async function closeCctvSession(cameraId: string): Promise<void> {
  const active = activeSessions.get(cameraId);
  if (!active) return;
  const adapter = getCctvAdapter(active.context.camera.protocol);
  await adapter.disconnect(active.context);
  activeSessions.delete(cameraId);
}

export async function startCctvLiveView(camera: CctvCameraRecord): Promise<CctvLiveSession> {
  assertCapability(camera, 'liveView');
  const active = await openCctvSession(camera);
  const adapter = getCctvAdapter(camera.protocol);
  await adapter.startLiveView(active.context);
  active.live = true;
  active.session.state = 'connected';
  return active;
}

export async function stopCctvLiveView(cameraId: string): Promise<void> {
  const active = requireActive(cameraId);
  const adapter = getCctvAdapter(active.context.camera.protocol);
  await adapter.stopLiveView(active.context);
  active.live = false;
}

export async function startCctvRecording(camera: CctvCameraRecord): Promise<CctvLiveSession> {
  assertCapability(camera, 'recordings');
  const active = await startCctvLiveView(camera);
  const adapter = getCctvAdapter(camera.protocol);
  await adapter.startRecording(active.context);
  active.recording = true;
  active.session.state = 'recording';
  return active;
}

export async function stopCctvRecording(cameraId: string): Promise<void> {
  const active = requireActive(cameraId);
  const adapter = getCctvAdapter(active.context.camera.protocol);
  await adapter.stopRecording(active.context);
  active.recording = false;
  active.session.state = active.live ? 'connected' : 'connecting';
}

export async function searchCctvRecordings(
  camera: CctvCameraRecord,
  query: CctvRecordingSearch,
): Promise<CctvRecordingItem[]> {
  assertCapability(camera, 'playback');
  const active = await openCctvSession(camera);
  const adapter = getCctvAdapter(camera.protocol);
  return adapter.searchRecordings(active.context, query);
}

export function getActiveCctvSession(cameraId: string): CctvLiveSession | null {
  try {
    return requireActive(cameraId);
  } catch {
    return null;
  }
}
