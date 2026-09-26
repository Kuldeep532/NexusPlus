import { APP_API_BASE_URL } from '@/features/api-gateway/apiGatewayClient';

export type RemoteConfigKind = 'top_banner' | 'dialog' | 'feature_flag' | 'content';

export type RemoteConfigRow = {
  key: string;
  kind: RemoteConfigKind;
  enabled: boolean;
  title: string | null;
  message: string | null;
  action_label: string | null;
  action_url: string | null;
  payload: Record<string, unknown>;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
  updated_at: string;
};

function configured(): boolean {
  return Boolean(APP_API_BASE_URL);
}

export async function fetchRemoteConfig(signal?: AbortSignal): Promise<RemoteConfigRow[]> {
  if (!configured()) return [];
  const response = await fetch(APP_API_BASE_URL + '/remote-config', {
    headers: { Accept:'application/json' },
    signal,
  });
  if (!response.ok) return [];
  const rows = await response.json() as RemoteConfigRow[];
  const now = Date.now();
  return rows.filter((row) => {
    if (!row.enabled) return false;
    if (row.starts_at && Date.parse(row.starts_at) > now) return false;
    if (row.ends_at && Date.parse(row.ends_at) < now) return false;
    return true;
  });
}

export function getRemoteConfigValue<T = unknown>(
  rows: RemoteConfigRow[],
  key: string,
  fallback: T,
): T {
  const row = rows.find((item) => item.key === key && item.enabled);
  if (!row) return fallback;
  return (row.payload?.value as T | undefined) ?? fallback;
}
