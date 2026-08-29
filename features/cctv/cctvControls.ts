import { assertCapability, CctvBackendError, getCctvAdapter, type CctvCameraRecord } from './cctvBackend';
import { getActiveCctvSession, openCctvSession } from './cctvSession';

export type CctvLiveControl = 'start' | 'stop' | 'sound' | 'switch_camera' | 'playback' | 'flip' | 'ptz' | 'night_vision' | 'talk';

export async function executeCctvLiveControl(camera: CctvCameraRecord, control: CctvLiveControl): Promise<void> {
  if (control === 'start') {
    assertCapability(camera, 'liveView');
    const session = await openCctvSession(camera);
    await getCctvAdapter(camera.protocol).startLiveView(session.context);
    return;
  }
  const active = getActiveCctvSession(camera.id);
  if (!active) throw new CctvBackendError({ code: 'NOT_FOUND', message: 'Start the live session before using camera controls.', retryable: true });
  if (control === 'stop') {
    await getCctvAdapter(camera.protocol).stopLiveView(active.context);
    return;
  }
  if (control === 'sound') { assertCapability(camera, 'audio'); return; }
  if (control === 'switch_camera') { assertCapability(camera, 'switchCamera'); return; }
  if (control === 'playback') { assertCapability(camera, 'playback'); return; }
  if (control === 'flip') { assertCapability(camera, 'flip'); return; }
  if (control === 'ptz') { assertCapability(camera, 'panTiltZoom'); return; }
  if (control === 'night_vision') { assertCapability(camera, 'nightVision'); return; }
  if (control === 'talk') { assertCapability(camera, 'talk'); return; }
}
