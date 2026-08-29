import { detectCctvCamera, type CctvDetectionInput } from './cctvService';
import { cctvCredentialStore } from './cctvBackend';
import { removeCctvCamera, listCctvCameraRecords, upsertCctvCamera } from './cctvRepository';
import type { CctvCamera } from './cctvTypes';

export async function addCctvCamera(input: CctvDetectionInput): Promise<CctvCamera> {
  const camera = await detectCctvCamera(input);
  await upsertCctvCamera(camera);
  await cctvCredentialStore.save(camera.id, input.username, input.password);
  return camera;
}

export async function removeCctvCameraSecurely(cameraId: string): Promise<void> {
  await cctvCredentialStore.remove(cameraId);
  await removeCctvCamera(cameraId);
}

export async function getCctvCameras(): Promise<CctvCamera[]> {
  return listCctvCameraRecords();
}
