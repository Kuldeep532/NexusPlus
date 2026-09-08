import * as Crypto from 'expo-crypto';
import type { CctvCamera, CctvCapabilities, CctvDiscoveryMode, CctvDeviceKind } from './cctvTypes';
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
  liveView: true,
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
  protocol: CctvCamera['protocol'];
  deviceKind: CctvDeviceKind;
  authentication?: { profile?: string; fields?: string[] };
  capabilities?: Partial<CctvCapabilities>;
}

function parseSupportedQrPayload(payload: string): Partial<CctvCamera> & { valid: boolean } {
  if (!payload.startsWith(CCTV_QR_PREFIX)) return { valid: false };
  try {
    const encoded = payload.slice(CCTV_QR_PREFIX.length);
    const parsed = JSON.parse(decodeURIComponent(encoded)) as Partial<CctvQrPayload>;
    if (parsed.version !== 1 || parsed.kind !== 'cctv') return { valid: false };
    if (typeof parsed.manufacturer !== 'string' || typeof parsed.model !== 'string' || typeof parsed.serialNumber !== 'string') return { valid: false };
    const kind = parsed.deviceKind;
    const deviceKind: CctvDeviceKind | undefined = kind === 'ip_camera' || kind === 'network_camera' || kind === 'dvr' || kind === 'nvr' ? kind : undefined;
    if (!deviceKind) return { valid: false };
    if (parsed.protocol !== 'onvif' && parsed.protocol !== 'rtsp' && parsed.protocol !== 'http') return { valid: false };
    return {
      valid: true,
      manufacturer: parsed.manufacturer.trim(),
      model: parsed.model.trim(),
      serialNumber: parsed.serialNumber.trim(),
      protocol: parsed.protocol,
      deviceKind,
      capabilities: { ...DEFAULT_CAPABILITIES, ...(parsed.capabilities ?? {}) },
    };
  } catch {
    return { valid: false };
  }
}

export function isSupportedCctvQrPayload(payload: string): boolean {
  return parseSupportedQrPayload(payload).valid;
}

export async function detectCctvCamera(input: CctvDetectionInput): Promise<CctvCamera> {
  const qrInfo = input.mode === 'qr' && input.qrPayload ? parseSupportedQrPayload(input.qrPayload) : { valid: false };
  if (input.mode === 'qr' && !qrInfo.valid) {
    throw new Error('Unsupported QR code. Scan the QR code shown by this CCTV camera or DVR/NVR.');
  }
  const manufacturer = input.manufacturer?.trim() ?? qrInfo.manufacturer;
  const model = input.model?.trim() ?? qrInfo.model;
  const serialNumber = input.serialNumber?.trim() ?? qrInfo.serialNumber;
  const protocol = qrInfo.protocol ?? 'unknown';
  const now = Date.now();
  const identity = [manufacturer ?? '', serialNumber ?? model ?? 'camera', input.username.trim().toLowerCase()].join(':');
  const id = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, identity);
  const authenticationProfile = detectAuthenticationProfile({ manufacturer, model, protocol, qrPayload: input.qrPayload, source: input.mode });
  return { id, name: model ?? serialNumber ?? 'CCTV Camera', serialNumber, model, manufacturer, protocol, deviceKind: qrInfo.deviceKind, username: input.username.trim(), passwordRef: id, createdAt: now, updatedAt: now, capabilities: qrInfo.capabilities ?? DEFAULT_CAPABILITIES, authenticationProfile };
}

export function getMaskedCameraLabel(camera: CctvCamera): string { const serial = camera.serialNumber; return serial ? `Serial ending ${serial.slice(-4)}` : camera.name; }
export function supportsCctvCapability(camera: CctvCamera, capability: keyof CctvCapabilities): boolean { return camera.capabilities[capability]; }
