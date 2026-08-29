import * as SecureStore from 'expo-secure-store';
import type { CctvCamera } from './cctvTypes';
import type { CctvDeviceKind } from './cctvTypes';

const DEVICES_KEY = 'nexus_plus_cctv_devices_v1';

export interface CctvManagedDevice {
  id: string;
  kind: CctvDeviceKind;
  name: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  cameraIds: string[];
  createdAt: number;
  updatedAt: number;
}

async function readDevices(): Promise<CctvManagedDevice[]> {
  const raw = await SecureStore.getItemAsync(DEVICES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed as CctvManagedDevice[] : [];
  } catch {
    return [];
  }
}

async function writeDevices(devices: CctvManagedDevice[]): Promise<void> {
  await SecureStore.setItemAsync(DEVICES_KEY, JSON.stringify(devices), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function listManagedDevices(): Promise<CctvManagedDevice[]> {
  return readDevices();
}

export async function upsertManagedDevice(device: CctvManagedDevice): Promise<void> {
  const devices = await readDevices();
  const next = devices.some((item) => item.id === device.id)
    ? devices.map((item) => item.id === device.id ? device : item)
    : [...devices, device];
  await writeDevices(next);
}

export async function rebuildManagedDevices(cameras: CctvCamera[]): Promise<CctvManagedDevice[]> {
  const existing = await readDevices();
  const byId = new Map(existing.map((item) => [item.id, item]));
  const now = Date.now();
  const devices = new Map<string, CctvManagedDevice>();

  for (const camera of cameras) {
    const deviceKind = camera.deviceKind ?? 'ip_camera';
    const deviceId = camera.serialNumber
      ? `${deviceKind}:${camera.manufacturer ?? 'unknown'}:${camera.serialNumber}`.toLowerCase()
      : `camera:${camera.id}`;
    const existingDevice = byId.get(deviceId);
    const current = devices.get(deviceId);
    devices.set(deviceId, {
      id: deviceId,
      kind: deviceKind,
      name: existingDevice?.name ?? camera.name,
      manufacturer: camera.manufacturer,
      model: camera.model,
      serialNumber: camera.serialNumber,
      cameraIds: [...(current?.cameraIds ?? []), camera.id],
      createdAt: existingDevice?.createdAt ?? camera.createdAt ?? now,
      updatedAt: now,
    });
  }

  const next = [...devices.values()];
  await writeDevices(next);
  return next;
}
