import type { CctvCamera, CctvCapabilities, CctvDeviceKind } from './cctvTypes';
import { listCctvCameraRecords, upsertCctvCamera } from './cctvRepository';
import { deriveStableCameraId, cctvCredentialStore, sanitizeNetworkField } from './cctvBackend';
import { rebuildManagedDevices, type CctvManagedDevice } from './cctvDeviceRegistry';

export interface CctvManagementState {
  devices: CctvManagedDevice[];
  cameras: CctvCamera[];
}

function inferKind(camera: CctvCamera): CctvDeviceKind {
  if (camera.deviceKind) return camera.deviceKind;
  const value = `${camera.manufacturer ?? ''} ${camera.model ?? ''}`.toLowerCase();
  if (value.includes('nvr')) return 'nvr';
  if (value.includes('dvr')) return 'dvr';
  if (camera.protocol === 'onvif' || camera.protocol === 'rtsp') return 'network_camera';
  return 'ip_camera';
}

export async function getCctvManagementState(): Promise<CctvManagementState> {
  const cameras = (await listCctvCameraRecords()).map((camera) => ({ ...camera, deviceKind: inferKind(camera) }));
  const devices = await rebuildManagedDevices(cameras);
  return { cameras, devices };
}

export async function saveManagedCamera(input: {
  name: string;
  username: string;
  password: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  protocol: CctvCamera['protocol'];
  deviceKind?: CctvDeviceKind;
  host?: string;
  port?: number;
  capabilities: CctvCapabilities;
}): Promise<CctvCamera> {
  const id = await deriveStableCameraId({
    manufacturer: input.manufacturer,
    serialNumber: input.serialNumber,
    host: sanitizeNetworkField(input.host),
    username: input.username,
  });
  const now = Date.now();
  const camera: CctvCamera = {
    id,
    name: input.name.trim(),
    serialNumber: input.serialNumber?.trim() || undefined,
    model: input.model?.trim() || undefined,
    manufacturer: input.manufacturer?.trim() || undefined,
    protocol: input.protocol,
    deviceKind: input.deviceKind ?? 'ip_camera',
    host: sanitizeNetworkField(input.host),
    port: input.port,
    username: input.username.trim(),
    passwordRef: id,
    createdAt: now,
    updatedAt: now,
    capabilities: input.capabilities,
  };
  await upsertCctvCamera(camera);
  await cctvCredentialStore.save(camera.id, camera.username, input.password);
  await rebuildManagedDevices([...(await listCctvCameraRecords()), camera]);
  return camera;
}
