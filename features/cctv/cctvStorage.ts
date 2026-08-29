import * as SecureStore from 'expo-secure-store';
import type { CctvCamera, CctvLocalSecrets } from './cctvTypes';

const CAMERAS_KEY = 'nexus_plus_cctv_cameras_v1';
const SECRET_PREFIX = 'nexus_plus_cctv_secret_';

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const value = await SecureStore.getItemAsync(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  await SecureStore.setItemAsync(key, JSON.stringify(value));
}

export async function listCctvCameras(): Promise<CctvCamera[]> {
  return readJson<CctvCamera[]>(CAMERAS_KEY, []);
}

export async function saveCctvCamera(camera: CctvCamera): Promise<void> {
  const cameras = await listCctvCameras();
  const next = cameras.some((item) => item.id === camera.id)
    ? cameras.map((item) => (item.id === camera.id ? camera : item))
    : [...cameras, camera];
  await writeJson(CAMERAS_KEY, next);
}

export async function deleteCctvCamera(cameraId: string): Promise<void> {
  const cameras = await listCctvCameras();
  await writeJson(CAMERAS_KEY, cameras.filter((camera) => camera.id !== cameraId));
  await SecureStore.deleteItemAsync(`${SECRET_PREFIX}${cameraId}`);
}

export async function saveCctvSecrets(cameraId: string, secrets: CctvLocalSecrets): Promise<void> {
  await writeJson(`${SECRET_PREFIX}${cameraId}`, secrets);
}

export async function readCctvSecrets(cameraId: string): Promise<CctvLocalSecrets | null> {
  return readJson<CctvLocalSecrets | null>(`${SECRET_PREFIX}${cameraId}`, null);
}
