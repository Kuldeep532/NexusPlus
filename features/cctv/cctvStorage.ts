import type { CctvCamera, CctvLocalSecrets } from './cctvTypes';
import { cctvCredentialStore } from './cctvBackend';
import { listCctvCameraRecords, upsertCctvCamera, removeCctvCamera } from './cctvRepository';

/** Compatibility facade. All persisted CCTV state uses the hardened v3 repository. */
export async function listCctvCameras(): Promise<CctvCamera[]> {
  return listCctvCameraRecords();
}

export async function saveCctvCamera(camera: CctvCamera): Promise<void> {
  await upsertCctvCamera(camera);
}

export async function deleteCctvCamera(cameraId: string): Promise<void> {
  await cctvCredentialStore.remove(cameraId);
  await removeCctvCamera(cameraId);
}

export async function saveCctvSecrets(cameraId: string, secrets: CctvLocalSecrets): Promise<void> {
  await cctvCredentialStore.save(cameraId, secrets.username, secrets.password);
}

export async function readCctvSecrets(cameraId: string): Promise<CctvLocalSecrets | null> {
  return cctvCredentialStore.read(cameraId);
}
