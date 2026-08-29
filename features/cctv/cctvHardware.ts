import { CctvBackendError, cctvCredentialStore, assertCapability, getCctvAdapter, type CctvCameraRecord } from './cctvBackend';

export type CctvHardDiskAction = 'status' | 'format' | 'initialize' | 'repair' | 'eject';

export interface CctvHardDiskInfo {
  id: string;
  label: string;
  capacityBytes?: number;
  usedBytes?: number;
  health: 'unknown' | 'healthy' | 'warning' | 'failed';
  state: 'unknown' | 'ready' | 'initializing' | 'formatting' | 'repairing' | 'ejected';
}

export interface CctvHardwareControlContext {
  camera: CctvCameraRecord;
  adapter: ReturnType<typeof getCctvAdapter>;
}

function requireHardwareControl(camera: CctvCameraRecord): void {
  if (camera.deviceKind !== 'dvr' && camera.deviceKind !== 'nvr') {
    throw new CctvBackendError({ code: 'OPERATION_UNSUPPORTED', message: 'Hard-disk management is available only for DVR/NVR devices.', retryable: false });
  }
}

export async function authorizeHardwareAction(camera: CctvCameraRecord, password: string): Promise<CctvHardwareControlContext> {
  requireHardwareControl(camera);
  const supplied = password.trim();
  if (!supplied) throw new CctvBackendError({ code: 'AUTH_REQUIRED', message: 'Camera password is required for hard-disk management.', retryable: false });
  await cctvCredentialStore.withCredentials(camera.id, async (credentials) => {
    if (credentials.password !== supplied) {
      throw new CctvBackendError({ code: 'AUTH_FAILED', message: 'Camera password is incorrect.', retryable: false });
    }
  });
  return { camera, adapter: getCctvAdapter(camera.protocol) };
}

export async function manageCctvHardDisk(camera: CctvCameraRecord, password: string, action: CctvHardDiskAction): Promise<CctvHardDiskInfo[]> {
  const context = await authorizeHardwareAction(camera, password);
  if (action !== 'status') {
    throw new CctvBackendError({ code: 'NOT_IMPLEMENTED', message: 'This hard-disk operation requires a verified DVR/NVR hardware adapter.', retryable: false });
  }
  void context;
  return [];
}

export function assertAudioControl(camera: CctvCameraRecord): void { assertCapability(camera, 'audio'); }
