import { useCallback, useEffect, useState } from 'react';
import type { CctvCamera } from './cctvTypes';
import { addCctvCamera, getCctvCameras, removeCctvCameraSecurely } from './cctvController';
import type { CctvDetectionInput } from './cctvService';

export function useCctvCameras() {
  const [cameras, setCameras] = useState<CctvCamera[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setCameras(await getCctvCameras());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addCamera = useCallback(async (input: CctvDetectionInput) => {
    const camera = await addCctvCamera(input);
    await reload();
    return camera;
  }, [reload]);

  const removeCamera = useCallback(async (cameraId: string) => {
    await removeCctvCameraSecurely(cameraId);
    await reload();
  }, [reload]);

  return { cameras, loading, reload, addCamera, removeCamera };
}
