import { detectCctvCamera, type CctvDetectionInput } from './cctvService';
import { cctvCredentialStore } from './cctvBackend';
import { removeCctvCamera, listCctvCameraRecords, upsertCctvCamera } from './cctvRepository';
import type { CctvCamera } from './cctvTypes';
import type { CctvCameraRecord } from './cctvBackend';
import { getCctvAdapter, CctvBackendError } from './cctvBackend';

export async function addCctvCamera(input: CctvDetectionInput): Promise<CctvCamera> {
  const camera = await detectCctvCamera(input);
  if (camera.protocol === 'onvif' && (!camera.securityProfile?.authenticated || !camera.securityProfile.secureTransport || camera.securityProfile.securityLevel !== 'verified')) {
    throw new CctvBackendError({ code: 'AUTH_FAILED', message: 'Camera must pass verified secure authorization before it can be saved.', retryable: false });
  }
  await upsertCctvCamera(camera);
  try {
    await cctvCredentialStore.save(camera.id, input.username, input.password);
  } catch (error) {
    await removeCctvCamera(camera.id);
    throw error;
  }
  return camera;
}

export async function removeCctvCameraSecurely(cameraId: string): Promise<void> {
  const normalized = cameraId.trim();
  if (!normalized) throw new CctvBackendError({ code: 'INVALID_INPUT', message: 'Camera ID is required.', retryable: false });
  await cctvCredentialStore.remove(normalized);
  await removeCctvCamera(normalized);
}

export async function getCctvCameras(): Promise<CctvCameraRecord[]> {
  return listCctvCameraRecords();
}

/** Persist only capabilities proven by the authenticated native protocol adapter. */
export async function refreshCctvAuthorization(camera: CctvCameraRecord): Promise<CctvCameraRecord> {
  const adapter = getCctvAdapter(camera.protocol);
  const context = await adapter.connect(camera);
  try {
    const verified = context.capabilities;
    const next: CctvCameraRecord = {
      ...camera,
      capabilities: verified,
      securityProfile: camera.securityProfile ? { ...camera.securityProfile, authenticated: true, secureTransport: true, securityLevel: 'verified', protocolFamily: camera.protocol === 'onvif' ? 'onvif' : 'unknown' } : camera.securityProfile,
      connectionState: 'connected',
      lastConnectedAt: Date.now(),
      lastErrorCode: undefined,
      updatedAt: Date.now(),
      schemaVersion: 3,
    };
    await upsertCctvCamera(next);
    return next;
  } finally {
    await adapter.disconnect(context);
  }
}
