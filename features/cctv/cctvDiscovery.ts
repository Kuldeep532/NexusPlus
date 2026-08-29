import type { CctvCamera } from './cctvTypes';
import type { CctvCameraRecord, CctvProtocolAdapter } from './cctvBackend';
import { getCctvAdapter } from './cctvBackend';

export type CctvDiscoverySource = 'qr' | 'serial' | 'lan' | 'manual';

export interface CctvDiscoveryRequest {
  source: CctvDiscoverySource;
  serialNumber?: string;
  qrPayload?: string;
  manufacturer?: string;
  model?: string;
  timeoutMs?: number;
}

export interface CctvDiscoveryResult {
  cameras: CctvCameraRecord[];
  source: CctvDiscoverySource;
}

function normalizeTimeout(timeoutMs?: number): number {
  return Math.min(Math.max(Math.trunc(timeoutMs ?? 5000), 1000), 15000);
}

export function createDiscoveryAdapter(protocol: CctvCamera['protocol']): CctvProtocolAdapter {
  return getCctvAdapter(protocol);
}

/**
 * LAN discovery is intentionally adapter-driven. The client does not fabricate
 * ONVIF multicast packets or RTSP endpoints here; protocol-specific discovery
 * belongs to native/network adapters once a real implementation is available.
 */
export async function discoverCctvCameras(request: CctvDiscoveryRequest): Promise<CctvDiscoveryResult> {
  const timeoutMs = normalizeTimeout(request.timeoutMs);
  void timeoutMs;

  if (request.source === 'lan') {
    return { cameras: [], source: 'lan' };
  }

  // QR/serial/manual onboarding continues through the existing detection
  // service, while adapter discovery remains the transport boundary.
  return { cameras: [], source: request.source };
}

export function isLanPreferred(camera: CctvCamera): boolean {
  return Boolean(camera.host && camera.port && camera.protocol !== 'unknown');
}
