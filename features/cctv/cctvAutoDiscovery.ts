import type { CctvCapabilities, CctvDeviceKind, CctvProtocol } from './cctvTypes';

export interface AutoDiscoveredCctv {
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  protocol: CctvProtocol;
  deviceKind?: CctvDeviceKind;
  host?: string;
  port?: number;
  capabilities: CctvCapabilities;
  security: {
    verified: boolean;
    transport: 'tls' | 'local' | 'unknown';
    authentication: 'digest' | 'token' | 'password' | 'unknown';
  };
}

const DEFAULT_CAPABILITIES: CctvCapabilities = {
  liveView: true,
  audio: false,
  recordings: false,
  playback: false,
  eraseData: false,
  passwordChange: false,
  discovery: true,
  multiCamera: false,
  switchCamera: false,
  flip: false,
  panTiltZoom: false,
  nightVision: false,
  talk: false,
};

/**
 * Normalizes information learned from a standards-compliant discovery adapter.
 * This layer deliberately contains no manufacturer/model database.
 */
export function normalizeDiscoveredCctv(input: Partial<AutoDiscoveredCctv>): AutoDiscoveredCctv | null {
  if (input.protocol !== 'onvif' && input.protocol !== 'rtsp' && input.protocol !== 'http') return null;
  const host = input.host?.trim() || undefined;
  const port = input.port && Number.isInteger(input.port) && input.port > 0 && input.port < 65536 ? input.port : undefined;
  const capabilities = { ...DEFAULT_CAPABILITIES, ...(input.capabilities ?? {}) };
  const security = input.security ?? { verified: false, transport: 'unknown', authentication: 'unknown' };
  if (!security.verified) return null;
  if (security.transport !== 'tls' && security.transport !== 'local') return null;
  if (security.authentication !== 'digest' && security.authentication !== 'token' && security.authentication !== 'password') return null;
  return {
    manufacturer: input.manufacturer?.trim() || undefined,
    model: input.model?.trim() || undefined,
    serialNumber: input.serialNumber?.trim() || undefined,
    protocol: input.protocol,
    deviceKind: input.deviceKind,
    host,
    port,
    capabilities,
    security,
  };
}

export function isSecureAutoDiscoveryResult(device: AutoDiscoveredCctv): boolean {
  return device.security.verified && (device.security.transport === 'tls' || device.security.transport === 'local') && device.security.authentication !== 'unknown';
}
