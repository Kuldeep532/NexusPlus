import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

export type ComputerPlatform = 'windows' | 'macos' | 'linux' | 'unknown';

export type ComputerAgentInfo = {
  id: string;
  name: string;
  platform: ComputerPlatform;
  host: string;
  port: number;
  protocol: 'http' | 'https';
  capabilities: string[];
  version?: string;
};

export type ComputerAgentRequest = {
  action: string;
  args?: Record<string, string | number | boolean | null>;
  requestId?: string;
};

export type ComputerAgentResponse = {
  ok: boolean;
  requestId?: string;
  message?: string;
  data?: unknown;
  error?: string;
};

export const COMPUTER_AGENT_SERVICE = '_nexus-computer-agent._tcp';
export const COMPUTER_AGENT_PROTOCOL_VERSION = 1;

export function normalizeComputerPlatform(value: string | undefined): ComputerPlatform {
  const text = (value ?? '').toLowerCase();
  if (text.includes('win')) return 'windows';
  if (text.includes('mac') || text.includes('darwin') || text.includes('osx')) return 'macos';
  if (text.includes('linux') || text.includes('ubuntu')) return 'linux';
  return 'unknown';
}

export function buildComputerAgentUrl(agent: ComputerAgentInfo, path: string): string {
  const safePath = path.startsWith('/') ? path : `/${path}`;
  return `${agent.protocol}://${agent.host}:${agent.port}${safePath}`;
}

export async function probeComputerAgent(agent: ComputerAgentInfo): Promise<boolean> {
  try {
    const response = await fetch(buildComputerAgentUrl(agent, '/v1/health'), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function executeComputerAgentAction(
  agent: ComputerAgentInfo,
  request: ComputerAgentRequest,
): Promise<ComputerAgentResponse> {
  const response = await fetch(buildComputerAgentUrl(agent, '/v1/execute'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Nexus-Protocol': String(COMPUTER_AGENT_PROTOCOL_VERSION),
    },
    body: JSON.stringify(request),
  });

  const payload = (await response.json()) as ComputerAgentResponse;
  if (!response.ok) {
    throw new Error(payload.error || payload.message || `Computer agent request failed (${response.status}).`);
  }
  return payload;
}

export function supportsComputerAgentDiscovery(): boolean {
  return Platform.OS === 'android' || Platform.OS === 'ios';
}

export function buildAgentPairingUrl(agent: ComputerAgentInfo): string {
  return Linking.createURL('computer-agent', {
    queryParams: {
      host: agent.host,
      port: String(agent.port),
      platform: agent.platform,
      id: agent.id,
    },
  });
}
