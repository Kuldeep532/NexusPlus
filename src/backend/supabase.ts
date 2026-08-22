type SupabaseConfig = { url: string; anonKey: string };

const config: SupabaseConfig | null = (() => {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return url && anonKey ? { url: url.replace(/\/$/, ''), anonKey } : null;
})();

export function isSupabaseConfigured(): boolean {
  return Boolean(config);
}

export async function supabaseTable<T>(table: string, query = ''): Promise<T[]> {
  if (!config) return [];
  const response = await fetch(`${config.url}/rest/v1/${table}${query ? `?${query}` : ''}`, {
    headers: { apikey: config.anonKey, Authorization: `Bearer ${config.anonKey}` },
  });
  if (!response.ok) throw new Error(`Supabase request failed (${response.status}).`);
  return (await response.json()) as T[];
}

export async function supabaseSingle<T>(table: string, query: string): Promise<T | null> {
  const rows = await supabaseTable<T>(table, query);
  return rows[0] ?? null;
}
