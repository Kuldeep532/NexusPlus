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

function parseSupportedQrPayload(payload: string): Partial<CctvCamera> {
  try {
    const parsed = JSON.parse(payload) as Record<string, unknown>;
    const rawCapabilities = parsed.capabilities;
    const capabilities = rawCapabilities && typeof rawCapabilities === 'object' ? rawCapabilities as Partial<CctvCapabilities> : {};
    const kind = parsed.deviceKind;
    const deviceKind: CctvDeviceKind | undefined = kind === 'ip_camera' || kind === 'network_camera' || kind === 'dvr' || kind === 'nvr' ? kind : undefined;
    return {
      manufacturer: typeof parsed.manufacturer === 'string' ? parsed.manufacturer.trim() : undefined,
      model: typeof parsed.model === 'string' ? parsed.model.trim() : undefined,
      serialNumber: typeof parsed.serialNumber === 'string' ? parsed.serialNumber.trim() : undefined,
      protocol: parsed.protocol === 'onvif' || parsed.protocol === 'rtsp' || parsed.protocol === 'http' ? parsed.protocol : 'unknown',
      deviceKind,
      capabilities: { ...DEFAULT_CAPABILITIES, ...capabilities },
    };
  } catch { return {}; }
}

export async function detectCctvCamera(input: CctvDetectionInput): Promise<CctvCamera> {
  const qrInfo = input.mode === 'qr' && input.qrPayload ? parseSupportedQrPayload(input.qrPayload) : {};
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
