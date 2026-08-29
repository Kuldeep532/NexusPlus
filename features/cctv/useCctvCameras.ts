import { useCallback, useEffect, useState } from 'react';
import type { CctvCamera } from './cctvTypes';
import { deleteCctvCamera, listCctvCameras, saveCctvCamera, saveCctvSecrets } from './cctvStorage';
import { detectCctvCamera, type CctvDetectionInput } from './cctvService';

export function useCctvCameras() {
  const [cameras, setCameras] = useState<CctvCamera[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setCameras(await listCctvCameras());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addCamera = useCallback(async (input: CctvDetectionInput, erasePasswordHash = '') => {
    const camera = await detectCctvCamera(input);
    await saveCctvCamera(camera);
    await saveCctvSecrets(camera.id, {
      cameraPassword: input.password,
      erasePasswordHash,
    });
    await reload();
    return camera;
  }, [reload]);

  const removeCamera = useCallback(async (cameraId: string) => {
    await deleteCctvCamera(cameraId);
    await reload();
  }, [reload]);

  return { cameras, loading, reload, addCamera, removeCamera };
}
