import * as Crypto from 'expo-crypto';
import type { CctvCamera, CctvCapabilities, CctvDiscoveryMode } from './cctvTypes';

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
};

function parseSupportedQrPayload(payload: string): Partial<CctvCamera> {
  try {
    const parsed = JSON.parse(payload) as Record<string, unknown>;
    return {
      manufacturer: typeof parsed.manufacturer === 'string' ? parsed.manufacturer : undefined,
      model: typeof parsed.model === 'string' ? parsed.model : undefined,
      serialNumber: typeof parsed.serialNumber === 'string' ? parsed.serialNumber : undefined,
      protocol: parsed.protocol === 'onvif' || parsed.protocol === 'rtsp' || parsed.protocol === 'http' ? parsed.protocol : 'unknown',
      capabilities: {
        ...DEFAULT_CAPABILITIES,
        ...(typeof parsed.capabilities === 'object' && parsed.capabilities ? parsed.capabilities : {}),
      },
    };
  } catch {
    return {};
  }
}

export async function detectCctvCamera(input: CctvDetectionInput): Promise<CctvCamera> {
  const qrInfo = input.mode === 'qr' && input.qrPayload ? parseSupportedQrPayload(input.qrPayload) : {};
  const now = Date.now();
  const id = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${input.serialNumber ?? qrInfo.serialNumber ?? ''}:${input.username}:${now}`);

  return {
    id,
    name: input.model ?? qrInfo.model ?? input.serialNumber ?? 'CCTV Camera',
    serialNumber: input.serialNumber ?? qrInfo.serialNumber,
    model: input.model ?? qrInfo.model,
    manufacturer: input.manufacturer ?? qrInfo.manufacturer,
    protocol: qrInfo.protocol ?? 'unknown',
    username: input.username,
    passwordRef: id,
    createdAt: now,
    updatedAt: now,
    capabilities: qrInfo.capabilities ?? DEFAULT_CAPABILITIES,
  };
}

export function getMaskedCameraLabel(camera: CctvCamera): string {
  const serial = camera.serialNumber;
  return serial ? `Serial ending ${serial.slice(-4)}` : camera.name;
}

export function supportsCctvCapability(camera: CctvCamera, capability: keyof CctvCapabilities): boolean {
  return camera.capabilities[capability];
}
