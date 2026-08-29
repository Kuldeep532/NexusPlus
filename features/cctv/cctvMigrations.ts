import { listCctvCameraRecords, upsertCctvCamera } from './cctvRepository';

const CURRENT_SCHEMA_VERSION = 2;

export async function migrateCctvLocalState(): Promise<void> {
  const cameras = await listCctvCameraRecords();
  for (const camera of cameras) {
    if (camera.schemaVersion >= CURRENT_SCHEMA_VERSION) continue;
    await upsertCctvCamera({
      ...camera,
      updatedAt: Date.now(),
    });
  }
}

export { CURRENT_SCHEMA_VERSION };
