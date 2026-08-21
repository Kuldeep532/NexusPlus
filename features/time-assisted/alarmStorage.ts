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
    if (typeof candidate.id !== 'string' || candidate.id.length === 0 || candidate.id.length > 128) return [];
    if (!Number.isInteger(candidate.hour) || candidate.hour < 0 || candidate.hour > 23) return [];
    if (!Number.isInteger(candidate.minute) || candidate.minute < 0 || candidate.minute > 59) return [];
    if (typeof candidate.enabled !== 'boolean' || typeof candidate.soundId !== 'string' || candidate.soundId.length > 128) return [];
    return [{ id: candidate.id, hour: candidate.hour, minute: candidate.minute, enabled: candidate.enabled, soundId: candidate.soundId }];
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
