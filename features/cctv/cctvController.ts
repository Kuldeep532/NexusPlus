import { detectCctvCamera, type CctvDetectionInput } from './cctvService';
import { cctvCredentialStore, getCctvAdapter, CctvBackendError, type CctvCameraRecord } from './cctvBackend';
import { removeCctvCamera, listCctvCameraRecords, upsertCctvCamera } from './cctvRepository';
import type { CctvCamera } from './cctvTypes';

export async function addCctvCamera(input: CctvDetectionInput): Promise<CctvCamera> {
  if (input.mode === 'qr' && !input.qrPayload) throw new CctvBackendError({ code: 'INVALID_INPUT', message: 'Please provide the camera authorization QR code.', retryable: false });
  const camera = await detectCctvCamera(input);
  if (camera.protocol !== 'onvif') throw new CctvBackendError({ code: 'NOT_IMPLEMENTED', message: 'Only supported secure cameras can be added.', retryable: false });
  throw new CctvBackendError({ code: 'INVALID_INPUT', message: 'The camera must be securely verified before it can be saved.', retryable: false });
}

export async function verifyAndSaveCctvCamera(input: {
  camera: CctvCameraRecord;
  username: string;
  password: string;
  authorizedIdentity?: { manufacturer?: string; model?: string; serialNumber?: string };
}): Promise<CctvCameraRecord> {
  const base = {
    ...input.camera,
    username: input.username.trim(),
    capabilities: input.camera.capabilities,
    securityProfile: { secureTransport: true, authenticated: false, protocolFamily: 'onvif' as const, securityLevel: 'detected' as const, reason: 'Waiting for secure camera verification.' },
  } as CctvCameraRecord;
  if (!base.host || !base.port || base.protocol !== 'onvif') throw new CctvBackendError({ code: 'INVALID_INPUT', message: 'A secure camera connection is required.', retryable: false });
  if (!input.username.trim() || !input.password) throw new CctvBackendError({ code: 'AUTH_REQUIRED', message: 'Enter the camera username and password.', retryable: false });
  if (input.authorizedIdentity?.serialNumber && base.serialNumber && input.authorizedIdentity.serialNumber.trim().toLowerCase() !== base.serialNumber.trim().toLowerCase()) throw new CctvBackendError({ code: 'AUTH_FAILED', message: 'The camera details do not match the selected device.', retryable: false });
  await cctvCredentialStore.save(base.id, input.username.trim(), input.password);
  try {
    const adapter = getCctvAdapter('onvif');
    const context = await adapter.connect(base);
    try {
      const verified: CctvCameraRecord = {
        ...base,
        username: input.username.trim(),
        capabilities: context.capabilities,
        securityProfile: { secureTransport: true, authenticated: true, protocolFamily: 'onvif', securityLevel: 'verified' },
        connectionState: 'connected',
        lastConnectedAt: Date.now(),
        lastErrorCode: undefined,
        updatedAt: Date.now(),
        schemaVersion: 3,
      };
      await upsertCctvCamera(verified);
      return verified;
    } finally {
      await adapter.disconnect(context);
    }
  } catch (error) {
    await cctvCredentialStore.remove(base.id);
    if (error instanceof CctvBackendError) throw error;
    throw new CctvBackendError({ code: 'AUTH_FAILED', message: 'The camera could not be securely verified.', retryable: false });
  }
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

export async function refreshCctvAuthorization(camera: CctvCameraRecord): Promise<CctvCameraRecord> {
  const adapter = getCctvAdapter(camera.protocol);
  const context = await adapter.connect(camera);
  try {
    const verified: CctvCameraRecord = {
      ...camera,
      capabilities: context.capabilities,
      securityProfile: { ...(camera.securityProfile ?? { secureTransport: true, protocolFamily: camera.protocol === 'onvif' ? 'onvif' : 'unknown', securityLevel: 'detected' as const }), authenticated: true, secureTransport: true, securityLevel: 'verified', protocolFamily: camera.protocol === 'onvif' ? 'onvif' : 'unknown' },
      connectionState: 'connected',
      lastConnectedAt: Date.now(),
      lastErrorCode: undefined,
      updatedAt: Date.now(),
      schemaVersion: 3,
    };
    await upsertCctvCamera(verified);
    return verified;
  } finally {
    await adapter.disconnect(context);
  }
}
