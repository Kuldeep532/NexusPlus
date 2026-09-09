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

/**
 * Background discovery is correlation-only. A LAN result is never enough to
 * create a managed camera. The result must already be securely correlated by
 * the authorized QR/intent flow.
 */
export function normalizeDiscoveredCctv(input: Partial<AutoDiscoveredCctv>): AutoDiscoveredCctv | null {
  if (input.protocol !== 'onvif' && input.protocol !== 'rtsp' && input.protocol !== 'http') return null;
  const host = input.host?.trim() || undefined;
  const port = input.port && Number.isInteger(input.port) && input.port > 0 && input.port < 65536 ? input.port : undefined;
  const capabilities = input.capabilities;
  const security = input.security ?? { verified: false, transport: 'unknown', authentication: 'unknown' };
  if (!security.verified) return null;
  if (security.transport !== 'tls' && security.transport !== 'local') return null;
  if (security.authentication !== 'digest' && security.authentication !== 'token' && security.authentication !== 'password') return null;
  if (!capabilities?.liveView) return null;
  return { manufacturer: input.manufacturer?.trim() || undefined, model: input.model?.trim() || undefined, serialNumber: input.serialNumber?.trim() || undefined, protocol: input.protocol, deviceKind: input.deviceKind, host, port, capabilities, security };
}

export function isSecureAutoDiscoveryResult(device: AutoDiscoveredCctv): boolean {
  return device.security.verified
    && (device.security.transport === 'tls' || device.security.transport === 'local')
    && device.security.authentication !== 'unknown'
    && device.capabilities.liveView;
}

export function isAuthorizedDiscoveryMatch(device: AutoDiscoveredCctv, authorization: { manufacturer?: string; model?: string; serialNumber?: string }): boolean {
  if (!isSecureAutoDiscoveryResult(device)) return false;
  if (authorization.serialNumber && device.serialNumber) return authorization.serialNumber.trim().toLowerCase() === device.serialNumber.trim().toLowerCase();
  if (authorization.manufacturer && device.manufacturer && authorization.model && device.model) {
    return authorization.manufacturer.trim().toLowerCase() === device.manufacturer.trim().toLowerCase()
      && authorization.model.trim().toLowerCase() === device.model.trim().toLowerCase();
  }
  return false;
}
