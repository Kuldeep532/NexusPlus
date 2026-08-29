import {
  CctvBackendError,
  assertCapability,
  getCctvAdapter,
  type CctvCameraRecord,
  type CctvRecordingSearch,
} from './cctvBackend';
import { updateCctvCameraStatus } from './cctvRepository';
import {
  closeCctvSession,
  getActiveCctvSession,
  searchCctvRecordings,
  startCctvLiveView,
  startCctvRecording,
  stopCctvLiveView,
  stopCctvRecording,
} from './cctvSession';

export async function connectCctvCamera(camera: CctvCameraRecord) {
  try {
    const active = await startCctvLiveView(camera);
    await updateCctvCameraStatus(camera.id, {
      connectionState: 'connected',
      lastConnectedAt: Date.now(),
      lastErrorCode: undefined,
    });
    return active;
  } catch (cause: unknown) {
    const code = cause instanceof CctvBackendError ? cause.code : 'OPERATION_FAILED';
    await updateCctvCameraStatus(camera.id, { connectionState: 'error', lastErrorCode: code });
    throw cause;
  }
}

export async function disconnectCctvCamera(camera: CctvCameraRecord): Promise<void> {
  await closeCctvSession(camera.id);
  await updateCctvCameraStatus(camera.id, { connectionState: 'idle', lastErrorCode: undefined });
}

export async function setCctvRecording(camera: CctvCameraRecord, enabled: boolean) {
  assertCapability(camera, 'recordings');
  try {
    if (enabled) {
      const active = await startCctvRecording(camera);
      await updateCctvCameraStatus(camera.id, {
        connectionState: 'recording',
        lastConnectedAt: Date.now(),
        lastErrorCode: undefined,
      });
      return active;
    }
    await stopCctvRecording(camera.id);
    await updateCctvCameraStatus(camera.id, { connectionState: 'connected', lastErrorCode: undefined });
    return getActiveCctvSession(camera.id);
  } catch (cause: unknown) {
    const code = cause instanceof CctvBackendError ? cause.code : 'OPERATION_FAILED';
    await updateCctvCameraStatus(camera.id, { connectionState: 'error', lastErrorCode: code });
    throw cause;
  }
}

export async function stopCctvLive(camera: CctvCameraRecord): Promise<void> {
  const active = getActiveCctvSession(camera.id);
  if (!active) return;
  const adapter = getCctvAdapter(camera.protocol);
  await stopCctvLiveView(camera.id);
  await updateCctvCameraStatus(camera.id, { connectionState: 'idle', lastErrorCode: undefined });
  await adapter.disconnect(active.context);
}

export async function findCctvRecordings(camera: CctvCameraRecord, query: CctvRecordingSearch) {
  return searchCctvRecordings(camera, query);
}
