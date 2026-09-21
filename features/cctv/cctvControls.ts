import { assertCapability, CctvBackendError, getCctvAdapter, type CctvCameraRecord } from './cctvBackend';
import { getActiveCctvSession, startCctvLiveView, stopCctvLiveView } from './cctvSession';

export type CctvLiveControl = 'start' | 'stop' | 'playback' | 'ptz';

export async function executeCctvLiveControl(
  camera: CctvCameraRecord,
  control: CctvLiveControl,
  payload?: Record<string, unknown>,
): Promise<void> {
  if (control === 'start') {
    assertCapability(camera, 'liveView');
    await startCctvLiveView(camera);
    return;
  }

  const active = getActiveCctvSession(camera.id);
  if (!active) throw new CctvBackendError({ code: 'NOT_FOUND', message: 'Start the live session before using camera controls.', retryable: true });

  const adapter = getCctvAdapter(camera.protocol);
  if (control === 'stop') {
    await stopCctvLiveView(camera.id);
    return;
  }
  if (control === 'playback') {
    assertCapability(camera, 'playback');
    await adapter.setControl(active.context, 'playback', payload);
    return;
  }
  if (control === 'ptz') {
    assertCapability(camera, 'panTiltZoom');
    await adapter.setControl(active.context, 'ptz', payload);
  }
}
