import { NativeModules, Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import type { CctvCamera, CctvProtocol, CctvSecurityProfile } from './cctvTypes';
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

interface NativeOnvifDevice { sourceIp: string; endpoint?: string; xaddrs?: string; types?: string; scopes?: string; }
interface NativeDiscoveryModule { discover(timeoutMs: number): Promise<NativeOnvifDevice[]>; }
const nativeDiscovery = (NativeModules as { NexusCctvDiscovery?: NativeDiscoveryModule }).NexusCctvDiscovery;

function normalizeTimeout(timeoutMs?: number): number { return Math.min(Math.max(Math.trunc(timeoutMs ?? 5000), 1000), 15000); }

function parseEndpoint(value: string | undefined): { host?: string; port?: number; secureTransport: boolean } {
  if (!value) return { secureTransport: false };
  try {
    const url = new URL(value);
    const secureTransport = url.protocol === 'https:';
    const port = url.port ? Number(url.port) : secureTransport ? 443 : 80;
    return { host: url.hostname, port: Number.isFinite(port) ? port : undefined, secureTransport };
  } catch { return { secureTransport: false }; }
}

function inferDeviceKind(types = ''): CctvCamera['deviceKind'] {
  const normalized = types.toLowerCase();
  if (normalized.includes('networkvideodisplay')) return 'nvr';
  if (normalized.includes('networkvideotransmitter')) return 'network_camera';
  return 'ip_camera';
}
function extractManufacturer(scopes = ''): string | undefined { const match = scopes.match(/(?:^|\s)onvif:\/\/www\.onvif\.org\/name\/([^\s]+)/i); return match?.[1] ? decodeURIComponent(match[1]).replace(/_/g, ' ') : undefined; }
function extractModel(scopes = ''): string | undefined { const match = scopes.match(/(?:^|\s)onvif:\/\/www\.onvif\.org\/hardware\/([^\s]+)/i); return match?.[1] ? decodeURIComponent(match[1]).replace(/_/g, ' ') : undefined; }

function makeSecurityProfile(device: NativeOnvifDevice, secureTransport: boolean): CctvSecurityProfile {
  const profileTokens = `${device.types ?? ''} ${device.scopes ?? ''}`.toLowerCase();
  const profileTDetected = profileTokens.includes('profile_t');
  const authenticated = profileTDetected || profileTokens.includes('credential');
  if (secureTransport && authenticated) return { secureTransport: true, authenticated: true, protocolFamily: 'onvif', securityLevel: 'verified' };
  if (authenticated) return { secureTransport: false, authenticated: true, protocolFamily: 'onvif', securityLevel: 'detected', reason: 'ONVIF authentication detected without an HTTPS endpoint.' };
  return { secureTransport, authenticated: false, protocolFamily: 'onvif', securityLevel: 'rejected', reason: 'The discovery response did not advertise a verifiable authenticated camera profile.' };
}

export async function discoverCctvCameras(request: CctvDiscoveryRequest): Promise<CctvDiscoveryResult> {
  if (request.source !== 'lan') return { cameras: [], source: request.source };
  if (Platform.OS !== 'android' || !nativeDiscovery) return { cameras: [], source: 'lan' };
  const devices = await nativeDiscovery.discover(normalizeTimeout(request.timeoutMs));
  const cameras: CctvCameraRecord[] = [];
  for (const device of devices) {
    const xaddr = device.xaddrs?.split(/\s+/).find(Boolean);
    const endpoint = parseEndpoint(xaddr);
    const securityProfile = makeSecurityProfile(device, endpoint.secureTransport);
    if (securityProfile.securityLevel !== 'verified') continue;
    const manufacturer = extractManufacturer(device.scopes);
    const model = extractModel(device.scopes);
    const kind = inferDeviceKind(device.types);
    const protocol: CctvProtocol = 'onvif';
    const identity = [manufacturer ?? '', model ?? '', device.sourceIp, endpoint.port ?? '', device.endpoint ?? ''].join('|');
    const id = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, identity);
    const now = Date.now();
    cameras.push({
      id,
      name: model ?? manufacturer ?? `ONVIF Camera ${device.sourceIp}`,
      manufacturer,
      model,
      protocol,
      deviceKind: kind,
      host: endpoint.host ?? device.sourceIp,
      port: endpoint.port,
      username: '',
      passwordRef: id,
      createdAt: now,
      updatedAt: now,
      capabilities: { liveView: true, audio: false, recordings: false, playback: false, eraseData: false, passwordChange: false, discovery: true, multiCamera: false, switchCamera: false, flip: false, panTiltZoom: false, nightVision: false, talk: false },
      authenticationProfile: { id: 'username_password', fields: [{ id: 'username', label: 'Username', required: true }, { id: 'password', label: 'Password', required: true, secret: true }], source: 'protocol', confidence: 'verified' },
      securityProfile,
      connectionState: 'idle',
      schemaVersion: 2,
    });
  }
  return { cameras, source: 'lan' };
}
export function createDiscoveryAdapter(protocol: CctvCamera['protocol']): CctvProtocolAdapter { return getCctvAdapter(protocol); }
export function isLanPreferred(camera: CctvCamera): boolean { return Boolean(camera.host && camera.port && camera.protocol !== 'unknown'); }
