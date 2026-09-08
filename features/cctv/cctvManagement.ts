import type { CctvCamera, CctvCapabilities, CctvDeviceKind, CctvAuthenticationProfile } from './cctvTypes';
import { listCctvCameraRecords, upsertCctvCamera } from './cctvRepository';
import { deriveStableCameraId, cctvCredentialStore } from './cctvBackend';
import { detectAuthenticationProfile } from './cctvAuthProfile';

export interface CctvManagementState {
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
  const cameras = (await listCctvCameraRecords()).map((camera) => ({
    ...camera,
    deviceKind: inferKind(camera),
    authenticationProfile: camera.authenticationProfile ?? detectAuthenticationProfile({
      source: 'protocol',
      manufacturer: camera.manufacturer,
      model: camera.model,
      protocol: camera.protocol,
    }),
  }));
  return { cameras };
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
  authenticationProfile?: CctvAuthenticationProfile;
  capabilities: CctvCapabilities;
}): Promise<CctvCamera> {
  const authProfile = input.authenticationProfile ?? detectAuthenticationProfile({
    source: 'manual',
    manufacturer: input.manufacturer,
    model: input.model,
    protocol: input.protocol,
  });
  const id = await deriveStableCameraId({
    manufacturer: input.manufacturer,
    serialNumber: input.serialNumber,
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
    username: input.username.trim(),
    passwordRef: id,
    createdAt: now,
    updatedAt: now,
    capabilities: input.capabilities,
    authenticationProfile: authProfile,
  };
  await upsertCctvCamera(camera);
  await cctvCredentialStore.save(camera.id, camera.username, input.password);
  return camera;
}
