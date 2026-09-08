import * as Crypto from 'expo-crypto';
import type { CctvCamera, CctvCapabilities, CctvDiscoveryMode, CctvDeviceKind, CctvSecurityProfile } from './cctvTypes';
import { detectAuthenticationProfile } from './cctvAuthProfile';

export interface CctvDetectionInput {
  mode: CctvDiscoveryMode;
  serialNumber?: string;
  qrPayload?: string;
  model?: string;
  manufacturer?: string;
  username: string;
  password: string;
}

export const CCTV_QR_PREFIX = 'nexusplus://cctv/';
const DEFAULT_CAPABILITIES: CctvCapabilities = {
  liveView: false,
  audio: false,
  recordings: false,
  playback: false,
  eraseData: false,
  passwordChange: false,
  discovery: false,
  multiCamera: false,
  switchCamera: false,
  flip: false,
  panTiltZoom: false,
  nightVision: false,
  talk: false,
};

export interface CctvQrPayload {
  version: 1;
  kind: 'cctv';
  manufacturer: string;
  model: string;
  serialNumber: string;
  protocol: Exclude<CctvCamera['protocol'], 'unknown'>;
  deviceKind: CctvDeviceKind;
  authentication?: { profile?: string; fields?: string[] };
  capabilities?: Partial<CctvCapabilities>;
  security?: Partial<Pick<CctvSecurityProfile, 'secureTransport' | 'authenticated' | 'protocolFamily' | 'securityLevel'>>;
}

export interface CctvQrIdentity {
  valid: boolean;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  protocol?: CctvCamera['protocol'];
  deviceKind?: CctvDeviceKind;
  capabilities?: CctvCapabilities;
  securityProfile?: CctvSecurityProfile;
}

export function parseCctvQrPayload(payload: string): CctvQrIdentity {
  if (!payload.startsWith(CCTV_QR_PREFIX)) return { valid: false };
  try {
    const parsed = JSON.parse(decodeURIComponent(payload.slice(CCTV_QR_PREFIX.length))) as Partial<CctvQrPayload>;
    if (parsed.version !== 1 || parsed.kind !== 'cctv') return { valid: false };
    if (typeof parsed.manufacturer !== 'string' || !parsed.manufacturer.trim()) return { valid: false };
    if (typeof parsed.model !== 'string' || !parsed.model.trim()) return { valid: false };
    if (typeof parsed.serialNumber !== 'string' || !parsed.serialNumber.trim()) return { valid: false };
    if (parsed.deviceKind !== 'ip_camera' && parsed.deviceKind !== 'network_camera' && parsed.deviceKind !== 'dvr' && parsed.deviceKind !== 'nvr') return { valid: false };
    if (parsed.protocol !== 'onvif' && parsed.protocol !== 'rtsp' && parsed.protocol !== 'http') return { valid: false };
    const security = parsed.security;
    const securityProfile: CctvSecurityProfile = {
      secureTransport: security?.secureTransport === true,
      authenticated: security?.authenticated === true,
      protocolFamily: security?.protocolFamily === 'onvif' ? 'onvif' : 'unknown',
      securityLevel: security?.securityLevel === 'verified' ? 'verified' : 'rejected',
      reason: security?.securityLevel === 'verified' ? undefined : 'CCTV QR authorization did not include a verified security profile.',
    };
    if (securityProfile.securityLevel !== 'verified' || !securityProfile.secureTransport || !securityProfile.authenticated) return { valid: false };
    return {
      valid: true,
      manufacturer: parsed.manufacturer.trim(),
      model: parsed.model.trim(),
      serialNumber: parsed.serialNumber.trim(),
      protocol: parsed.protocol,
      deviceKind: parsed.deviceKind,
      capabilities: { ...DEFAULT_CAPABILITIES, ...(parsed.capabilities ?? {}) },
      securityProfile,
    };
  } catch {
    return { valid: false };
  }
}

export function isSupportedCctvQrPayload(payload: string): boolean {
  return parseCctvQrPayload(payload).valid;
}

export async function detectCctvCamera(input: CctvDetectionInput): Promise<CctvCamera> {
  const qrInfo = input.mode === 'qr' && input.qrPayload ? parseCctvQrPayload(input.qrPayload) : { valid: false as const };
  if (input.mode === 'qr' && !qrInfo.valid) throw new Error('Unsupported CCTV authorization QR. A verified secure QR is required.');
  const manufacturer = input.manufacturer?.trim() || qrInfo.manufacturer;
  const model = input.model?.trim() || qrInfo.model;
  const serialNumber = input.serialNumber?.trim() || qrInfo.serialNumber;
  const protocol = qrInfo.protocol ?? 'unknown';
  const now = Date.now();
  const identity = [manufacturer ?? '', serialNumber ?? model ?? 'camera', input.username.trim().toLowerCase()].join(':');
  const id = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, identity);
  const authenticationProfile = detectAuthenticationProfile({ manufacturer, model, protocol, qrPayload: input.qrPayload, source: input.mode });
  return { id, name: model ?? serialNumber ?? 'CCTV Camera', serialNumber, model, manufacturer, protocol, deviceKind: qrInfo.deviceKind, username: input.username.trim(), passwordRef: id, createdAt: now, updatedAt: now, capabilities: qrInfo.capabilities ?? DEFAULT_CAPABILITIES, authenticationProfile, securityProfile: qrInfo.securityProfile };
}

export function getMaskedCameraLabel(camera: CctvCamera): string { const serial = camera.serialNumber; return serial ? `Serial ending ${serial.slice(-4)}` : camera.name; }
export function supportsCctvCapability(camera: CctvCamera, capability: keyof CctvCapabilities): boolean { return camera.capabilities[capability]; }
