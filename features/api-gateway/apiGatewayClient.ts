import { getSupabaseAccessToken } from '@/features/auth/supabaseAuthAdapter';

const GATEWAY_BASE_URL = 'https://apigateway.kuldeepky538.workers.dev';
const DISCOVERY_TTL_MS = 5 * 60 * 1000;

export type GatewayEndpoint = {
  id: string;
  path: string;
  method: string;
  description?: string;
  feature?: string;
};

type DiscoveryPayload = {
  endpoints?: unknown;
  apis?: unknown;
  routes?: unknown;
};

let cachedEndpoints: GatewayEndpoint[] | null = null;
let discoveryExpiresAt = 0;
let discoveryPromise: Promise<GatewayEndpoint[]> | null = null;

function normalizeEndpoints(payload: DiscoveryPayload): GatewayEndpoint[] {
  const source = payload?.endpoints ?? payload?.apis ?? payload?.routes;
  if (!Array.isArray(source)) return [];

  return source.flatMap((item, index) => {
    if (typeof item === 'string') {
      return [{ id: `endpoint-${index}`, path: item, method: 'GET' }];
    }
    if (!item || typeof item !== 'object') return [];
    const value = item as Record<string, unknown>;
    const path = typeof value.path === 'string' ? value.path : typeof value.url === 'string' ? value.url : '';
    const method = typeof value.method === 'string' ? value.method.toUpperCase() : 'GET';
    if (!path.startsWith('/')) return [];
    if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return [];
    return [{
      id: typeof value.id === 'string' ? value.id : `endpoint-${index}`,
      path,
      method,
      description: typeof value.description === 'string' ? value.description : undefined,
      feature: typeof value.feature === 'string' ? value.feature : undefined,
    }];
  });
}

export async function discoverGatewayEndpoints(force = false): Promise<GatewayEndpoint[]> {
  if (!force && cachedEndpoints && discoveryExpiresAt > Date.now()) return cachedEndpoints;
  if (discoveryPromise) return discoveryPromise;

  discoveryPromise = (async () => {
    const token = await getSupabaseAccessToken();
    const response = await fetch(`${GATEWAY_BASE_URL}/`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`GATEWAY_DISCOVERY_FAILED_${response.status}`);
    }

    const payload = await response.json() as DiscoveryPayload;
    const endpoints = normalizeEndpoints(payload);
    cachedEndpoints = endpoints;
    discoveryExpiresAt = Date.now() + DISCOVERY_TTL_MS;
    return endpoints;
  })().finally(() => {
    discoveryPromise = null;
  });

  return discoveryPromise;
}

export async function callGateway<T = unknown>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    query?: Record<string, string | number | boolean | null | undefined>;
  } = {},
): Promise<T> {
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('://')) {
    throw new Error('GATEWAY_PATH_MUST_BE_RELATIVE');
  }

  const token = await getSupabaseAccessToken();
  const url = new URL(`${GATEWAY_BASE_URL}${path}`);

  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  }

  const response = await fetch(url.toString(), {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    let message = `GATEWAY_REQUEST_FAILED_${response.status}`;
    try {
      const payload = await response.json();
      message = String(payload?.error ?? payload?.message ?? message);
    } catch {
      // Keep status-based error.
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function clearGatewayEndpointCache(): void {
  cachedEndpoints = null;
  discoveryExpiresAt = 0;
}

export { GATEWAY_BASE_URL };
