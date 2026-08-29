import type { CctvCamera } from './cctvTypes';
import { listCctvCameraRecords, upsertCctvCamera } from './cctvRepository';
import { deriveStableCameraId, cctvCredentialStore, sanitizeNetworkField } from './cctvBackend';

export type CctvDeviceKind = 'ip_camera' | 'network_camera' | 'dvr' | 'nvr';

export interface CctvManagementDevice {
  id: string;
  name: string;
  kind: CctvDeviceKind;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  cameraIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface CctvManagementState {
  devices: CctvManagementDevice[];
  cameras: CctvCamera[];
}

function inferKind(camera: CctvCamera): CctvDeviceKind {
  const value = `${camera.manufacturer ?? ''} ${camera.model ?? ''}`.toLowerCase();
  if (value.includes('nvr')) return 'nvr';
  if (value.includes('dvr')) return 'dvr';
  if (camera.protocol === 'onvif' || camera.protocol === 'rtsp') return 'network_camera';
  return 'ip_camera';
}

export async function getCctvManagementState(): Promise<CctvManagementState> {
  const cameras = await listCctvCameraRecords();
  return {
    cameras,
    devices: cameras.map((camera) => ({
      id: camera.id,
      name: camera.name,
      kind: inferKind(camera),
      manufacturer: camera.manufacturer,
      model: camera.model,
      serialNumber: camera.serialNumber,
      cameraIds: [camera.id],
      createdAt: camera.createdAt,
      updatedAt: camera.updatedAt,
    })),
  };
}

export async function saveManagedCamera(input: {
  name: string;
  username: string;
  password: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  protocol: CctvCamera['protocol'];
  host?: string;
  port?: number;
  capabilities: CctvCamera['capabilities'];
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
  return camera;
}
