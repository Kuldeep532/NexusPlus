import { assertCapability, CctvBackendError, getCctvAdapter, type CctvCameraRecord } from './cctvBackend';
import { getActiveCctvSession, openCctvSession } from './cctvSession';

export type CctvLiveControl = 'start' | 'stop' | 'sound' | 'switch_camera' | 'playback' | 'flip' | 'ptz' | 'night_vision' | 'talk';

function capabilityForControl(control: Exclude<CctvLiveControl, 'start' | 'stop' | 'playback'>) {
  return ({ sound: 'audio', switch_camera: 'switchCamera', flip: 'flip', ptz: 'panTiltZoom', night_vision: 'nightVision', talk: 'talk' } as const)[control];
}

export async function executeCctvLiveControl(camera: CctvCameraRecord, control: CctvLiveControl, payload?: Record<string, unknown>): Promise<void> {
  if (control === 'start') {
    assertCapability(camera, 'liveView');
    const session = await openCctvSession(camera);
    await getCctvAdapter(camera.protocol).startLiveView(session.context);
    return;
  }
  const active = getActiveCctvSession(camera.id);
  if (!active) throw new CctvBackendError({ code: 'NOT_FOUND', message: 'Start the live session before using camera controls.', retryable: true });
  const adapter = getCctvAdapter(camera.protocol);
  if (control === 'stop') { await adapter.stopLiveView(active.context); return; }
  if (control === 'playback') { assertCapability(camera, 'playback'); await adapter.setControl(active.context, 'playback', payload); return; }
  const capability = capabilityForControl(control);
  assertCapability(camera, capability);
  await adapter.setControl(active.context, control, payload);
}
