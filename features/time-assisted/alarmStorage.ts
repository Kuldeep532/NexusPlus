import * as SecureStore from 'expo-secure-store';

export type PersistedAlarm = {
  id: string;
  hour: number;
  minute: number;
  enabled: boolean;
  soundId: string;
};

const KEY = 'nexus-plus.time-assisted.alarms.v1';

function normalize(value: unknown): PersistedAlarm[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const candidate = item as Partial<PersistedAlarm>;
    const { id, hour, minute, enabled, soundId } = candidate;
    if (typeof id !== 'string' || id.length === 0 || id.length > 128) return [];
    if (typeof hour !== 'number' || !Number.isInteger(hour) || hour < 0 || hour > 23) return [];
    if (typeof minute !== 'number' || !Number.isInteger(minute) || minute < 0 || minute > 59) return [];
    if (typeof enabled !== 'boolean') return [];
    if (typeof soundId !== 'string' || soundId.length > 128) return [];
    return [{ id, hour, minute, enabled, soundId }];
  });
}

export async function loadPersistedAlarms(): Promise<PersistedAlarm[]> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return [];
    return normalize(JSON.parse(raw));
  } catch {
    return [];
  }
}

export async function savePersistedAlarms(alarms: PersistedAlarm[]): Promise<void> {
  await SecureStore.setItemAsync(KEY, JSON.stringify(normalize(alarms)));
}
