import type { CctvCamera } from './cctvTypes';
import { assertCapability, CctvBackendError, type CctvCameraRecord } from './cctvBackend';
import { getDefaultLanDiscoveryTransports } from './cctvLanDiscovery';

export function validateStage2Contracts(camera: CctvCameraRecord): void {
  if (camera.schemaVersion < 2) {
    throw new CctvBackendError({ code: 'INVALID_INPUT', message: 'CCTV camera record schema is outdated.', retryable: false });
  }
  if (camera.protocol === 'unknown') {
    throw new CctvBackendError({ code: 'UNSUPPORTED_PROTOCOL', message: 'A concrete CCTV protocol is required for transport.', retryable: false });
  }
}

export function getDiscoveryPlan(camera: CctvCamera): readonly string[] {
  return getDefaultLanDiscoveryTransports(camera.protocol);
}

export function assertLiveViewCapability(camera: CctvCamera): void {
  assertCapability(camera, 'liveView');
}

export function assertRecordingCapability(camera: CctvCamera): void {
  if (!camera.capabilities.recordings && !camera.capabilities.playback) {
    throw new CctvBackendError({ code: 'OPERATION_UNSUPPORTED', message: 'This camera does not expose recording or playback.', retryable: false });
  }
}
