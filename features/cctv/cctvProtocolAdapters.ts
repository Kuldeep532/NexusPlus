import type { CctvCamera } from './cctvTypes';
import {
  CctvBackendError,
  type CctvCameraRecord,
  type CctvProtocolAdapter,
  type CctvRecordingItem,
  type CctvRecordingSearch,
  type CctvSession,
  type CctvTransportContext,
  createSession,
  getCctvAdapter,
  validateRecordingSearch,
} from './cctvBackend';

export interface CctvAdapterFactory {
  create(protocol: CctvCamera['protocol']): CctvProtocolAdapter;
}

export const cctvAdapterFactory: CctvAdapterFactory = {
  create(protocol) {
    return getCctvAdapter(protocol);
  },
};

export function assertCameraConnectable(camera: CctvCameraRecord): void {
  if (camera.protocol === 'unknown') {
    throw new CctvBackendError({ code: 'UNSUPPORTED_PROTOCOL', message: 'Camera protocol is not supported.', retryable: false });
  }
  if (!camera.host || !camera.port) {
    throw new CctvBackendError({ code: 'NETWORK_UNAVAILABLE', message: 'Camera does not have a local network endpoint.', retryable: true });
  }
}

export async function connectCctvCamera(camera: CctvCameraRecord): Promise<CctvTransportContext> {
  assertCameraConnectable(camera);
  const adapter = cctvAdapterFactory.create(camera.protocol);
  return adapter.connect(camera);
}

export async function startCctvLiveView(context: CctvTransportContext): Promise<CctvTransportContext> {
  if (!context.capabilities.liveView) {
    throw new CctvBackendError({ code: 'OPERATION_UNSUPPORTED', message: 'Live view is not supported by this camera.', retryable: false });
  }
  const adapter = cctvAdapterFactory.create(context.camera.protocol);
  await adapter.startLiveView(context);
  return { ...context, session: { ...context.session, state: 'connected' } };
}

export async function stopCctvLiveView(context: CctvTransportContext): Promise<void> {
  const adapter = cctvAdapterFactory.create(context.camera.protocol);
  await adapter.stopLiveView(context);
}

export async function searchCctvRecordings(
  context: CctvTransportContext,
  query: CctvRecordingSearch,
): Promise<CctvRecordingItem[]> {
  if (!context.capabilities.recordings && !context.capabilities.playback) {
    throw new CctvBackendError({ code: 'OPERATION_UNSUPPORTED', message: 'Recording search is not supported by this camera.', retryable: false });
  }
  const normalized = validateRecordingSearch(query);
  const adapter = cctvAdapterFactory.create(context.camera.protocol);
  return adapter.searchRecordings(context, normalized);
}

export function createCctvSession(cameraId: string, ttlMs?: number): CctvSession {
  return createSession(cameraId, ttlMs);
}

export function isCctvSessionExpired(session: CctvSession, now = Date.now()): boolean {
  return session.expiresAt <= now;
}
