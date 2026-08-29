import * as SecureStore from 'expo-secure-store';
import type { CctvCamera } from './cctvTypes';
import { sanitizeCameraForPersistence } from './cctvBackend';
import type { CctvCameraRecord } from './cctvBackend';

const CAMERAS_KEY = 'nexus_plus_cctv_cameras_v2';

interface PersistedCctvState {
  schemaVersion: 2;
  cameras: CctvCameraRecord[];
}

async function readState(): Promise<PersistedCctvState> {
  const raw = await SecureStore.getItemAsync(CAMERAS_KEY);
  if (!raw) return { schemaVersion: 2, cameras: [] };
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedCctvState>;
    if (parsed.schemaVersion !== 2 || !Array.isArray(parsed.cameras)) {
      return { schemaVersion: 2, cameras: [] };
    }
    return { schemaVersion: 2, cameras: parsed.cameras };
  } catch {
    return { schemaVersion: 2, cameras: [] };
  }
}

async function writeState(state: PersistedCctvState): Promise<void> {
  await SecureStore.setItemAsync(CAMERAS_KEY, JSON.stringify(state), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function listCctvCameraRecords(): Promise<CctvCameraRecord[]> {
  const state = await readState();
  return state.cameras;
}

export async function upsertCctvCamera(camera: CctvCamera): Promise<CctvCameraRecord> {
  const next = sanitizeCameraForPersistence(camera);
  const state = await readState();
  const cameras = state.cameras.some((item) => item.id === next.id)
    ? state.cameras.map((item) => (item.id === next.id ? next : item))
    : [...state.cameras, next];
  await writeState({ schemaVersion: 2, cameras });
  return next;
}

export async function removeCctvCamera(cameraId: string): Promise<void> {
  const state = await readState();
  const cameras = state.cameras.filter((camera) => camera.id !== cameraId);
  if (cameras.length === state.cameras.length) return;
  await writeState({ schemaVersion: 2, cameras });
}

export async function updateCctvCameraStatus(
  cameraId: string,
  patch: Pick<CctvCameraRecord, 'connectionState' | 'lastConnectedAt' | 'lastErrorCode'>,
): Promise<CctvCameraRecord | null> {
  const state = await readState();
  const camera = state.cameras.find((item) => item.id === cameraId);
  if (!camera) return null;
  const updated: CctvCameraRecord = { ...camera, ...patch, updatedAt: Date.now() };
  await writeState({
    schemaVersion: 2,
    cameras: state.cameras.map((item) => (item.id === cameraId ? updated : item)),
  });
  return updated;
}

/** Compatibility bridge for older consumers. */
export async function listCctvCameras(): Promise<CctvCamera[]> {
  return listCctvCameraRecords();
}

export async function saveCctvCamera(camera: CctvCamera): Promise<void> {
  await upsertCctvCamera(camera);
}

export async function deleteCctvCamera(cameraId: string): Promise<void> {
  await removeCctvCamera(cameraId);
}
