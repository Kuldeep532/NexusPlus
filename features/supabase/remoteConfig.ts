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

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';

function configured(): boolean {
  return Boolean(SUPABASE_URL && ANON_KEY);
}

function isActive(row: RemoteConfigRow): boolean {
  if (!row.enabled) return false;
  const now = Date.now();
  if (row.starts_at && Date.parse(row.starts_at) > now) return false;
  if (row.ends_at && Date.parse(row.ends_at) < now) return false;
  return true;
}

export async function fetchRemoteConfig(signal?: AbortSignal): Promise<RemoteConfigRow[]> {
  if (!configured()) return [];

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/remote_config?select=*&enabled=eq.true&order=priority.desc,updated_at.desc`,
    {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        Accept: 'application/json',
      },
      signal,
    },
  );

  if (!response.ok) return [];
  const rows = await response.json() as RemoteConfigRow[];
  return rows.filter(isActive);
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
