import type { CctvCamera } from './cctvTypes';
import {
  assertCapability,
  createSession,
  getCctvAdapter,
  type CctvCameraRecord,
  type CctvSession,
  CctvBackendError,
} from './cctvBackend';
import { updateCctvCameraStatus } from './cctvRepository';

export interface CctvLiveSession {
  session: CctvSession;
  camera: CctvCameraRecord;
}

function ensureSessionActive(session: CctvSession): void {
  if (session.expiresAt <= Date.now()) {
    throw new CctvBackendError({
      code: 'AUTH_REQUIRED',
      message: 'The CCTV session has expired.',
      retryable: false,
    });
  }
}

export async function connectCctvCamera(camera: CctvCameraRecord): Promise<CctvLiveSession> {
  const adapter = getCctvAdapter(camera.protocol);
  const session = createSession(camera.id);
  await updateCctvCameraStatus(camera.id, { connectionState: 'connecting', lastErrorCode: undefined });

  try {
    const context = await adapter.connect(camera);
    session.state = 'connected';
    await updateCctvCameraStatus(camera.id, {
      connectionState: 'connected',
      lastConnectedAt: Date.now(),
      lastErrorCode: undefined,
    });
    void context;
    return { session, camera };
  } catch (error) {
    const code = error instanceof CctvBackendError ? error.code : 'OPERATION_FAILED';
    await updateCctvCameraStatus(camera.id, { connectionState: 'error', lastErrorCode: code });
    throw error;
  }
}

export async function startCctvLiveView(live: CctvLiveSession): Promise<void> {
  ensureSessionActive(live.session);
  assertCapability(live.camera, 'liveView');
  const adapter = getCctvAdapter(live.camera.protocol);
  const context = await adapter.connect(live.camera);
  await adapter.startLiveView(context);
}

export async function stopCctvLiveView(live: CctvLiveSession): Promise<void> {
  ensureSessionActive(live.session);
  const adapter = getCctvAdapter(live.camera.protocol);
  const context = await adapter.connect(live.camera);
  await adapter.stopLiveView(context);
  await adapter.disconnect(context);
  await updateCctvCameraStatus(live.camera.id, { connectionState: 'idle', lastErrorCode: undefined });
}

export async function startCctvRecording(live: CctvLiveSession): Promise<void> {
  ensureSessionActive(live.session);
  assertCapability(live.camera, 'recordings');
  const adapter = getCctvAdapter(live.camera.protocol);
  const context = await adapter.connect(live.camera);
  await adapter.startRecording(context);
  await updateCctvCameraStatus(live.camera.id, { connectionState: 'recording', lastErrorCode: undefined });
}

export async function stopCctvRecording(live: CctvLiveSession): Promise<void> {
  ensureSessionActive(live.session);
  assertCapability(live.camera, 'recordings');
  const adapter = getCctvAdapter(live.camera.protocol);
  const context = await adapter.connect(live.camera);
  await adapter.stopRecording(context);
  await adapter.disconnect(context);
  await updateCctvCameraStatus(live.camera.id, { connectionState: 'connected', lastErrorCode: undefined });
}

export function supportsProtocol(camera: CctvCamera): boolean {
  return camera.protocol === 'onvif' || camera.protocol === 'rtsp' || camera.protocol === 'http';
}
