import type { CctvCamera } from './cctvTypes';
import type { CctvConnectionState } from './cctvBackend';

export interface CctvHealthSnapshot {
  cameraId: string;
  state: CctvConnectionState;
  online: boolean;
  checkedAt: number;
}

export function getCctvHealth(camera: Pick<CctvCamera, 'id'> & { connectionState?: CctvConnectionState }): CctvHealthSnapshot {
  const state = camera.connectionState ?? 'idle';
  return {
    cameraId: camera.id,
    state,
    online: state === 'connected' || state === 'recording',
    checkedAt: Date.now(),
  };
}
