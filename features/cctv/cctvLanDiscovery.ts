import type { CctvCamera } from './cctvTypes';
import type { CctvBackendErrorShape, CctvCameraRecord } from './cctvBackend';

export type LanDiscoveryTransport = 'mdns' | 'ssdp' | 'onvif-multicast' | 'manual';

export interface LanDiscoveryCandidate {
  id: string;
  transport: LanDiscoveryTransport;
  host: string;
  port?: number;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  protocol: CctvCamera['protocol'];
  capabilities: CctvCamera['capabilities'];
}

export interface LanDiscoveryOptions {
  timeoutMs?: number;
  transports?: LanDiscoveryTransport[];
  signal?: AbortSignal;
}

export type LanDiscoveryResult = {
  candidates: LanDiscoveryCandidate[];
  elapsedMs: number;
};

const DEFAULT_TIMEOUT_MS = 5000;
const MAX_TIMEOUT_MS = 15000;

export class CctvLanDiscoveryUnavailableError extends Error {
  readonly code = 'NETWORK_UNAVAILABLE' as const;
  readonly retryable = true;
}

function normalizeTimeout(timeoutMs?: number): number {
  return Math.min(Math.max(Math.trunc(timeoutMs ?? DEFAULT_TIMEOUT_MS), 1000), MAX_TIMEOUT_MS);
}

export function getDefaultLanDiscoveryTransports(protocol: CctvCamera['protocol']): LanDiscoveryTransport[] {
  if (protocol === 'onvif') return ['onvif-multicast', 'ssdp', 'mdns'];
  if (protocol === 'rtsp' || protocol === 'http') return ['mdns', 'ssdp'];
  return ['mdns', 'ssdp'];
}

/**
 * Network probing is intentionally kept behind this boundary. A JS-only
 * implementation must not synthesize camera endpoints or send credentials.
 * Native discovery can implement the real multicast/mDNS/SSDP transports later.
 */
export async function discoverOnLan(options: LanDiscoveryOptions = {}): Promise<LanDiscoveryResult> {
  const startedAt = Date.now();
  const timeoutMs = normalizeTimeout(options.timeoutMs);
  const signal = options.signal;
  const deadline = Date.now() + timeoutMs;
  void deadline;
  if (signal?.aborted) throw new CctvLanDiscoveryUnavailableError('LAN discovery cancelled.');

  return { candidates: [], elapsedMs: Date.now() - startedAt };
}

export function toCameraRecord(candidate: LanDiscoveryCandidate, username: string, passwordRef: string, now = Date.now()): CctvCameraRecord {
  if (!candidate.host.trim()) throw new Error('CCTV discovery candidate has no host.');
  return {
    id: candidate.id,
    name: candidate.model ?? candidate.serialNumber ?? 'CCTV Camera',
    serialNumber: candidate.serialNumber,
    model: candidate.model,
    manufacturer: candidate.manufacturer,
    protocol: candidate.protocol,
    host: candidate.host,
    port: candidate.port,
    username,
    passwordRef,
    createdAt: now,
    updatedAt: now,
    capabilities: candidate.capabilities,
    schemaVersion: 2,
    connectionState: 'idle',
  };
}

export function toSafeDiscoveryError(error: unknown): CctvBackendErrorShape {
  if (error instanceof CctvLanDiscoveryUnavailableError) {
    return { code: 'NETWORK_UNAVAILABLE', message: 'LAN discovery is unavailable.', retryable: true };
  }
  return { code: 'OPERATION_FAILED', message: 'Camera discovery failed.', retryable: true };
}
