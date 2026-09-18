import AsyncStorage from '@react-native-async-storage/async-storage';

export type RemoteDeviceType = 'tv' | 'computer';
export type RemoteTransport = 'wifi' | 'bluetooth' | 'ir';

export type RemoteCapabilities = {
  power?: boolean;
  volume?: boolean;
  navigation?: boolean;
  keypad?: boolean;
  keyboard?: boolean;
  mouse?: boolean;
  voice?: boolean;
  ir?: boolean;
  media?: boolean;
};

export type RemoteConnection = {
  id: string;
  name: string;
  type: RemoteDeviceType;
  transport: RemoteTransport;
  address?: string;
  port?: number;
  capabilities: RemoteCapabilities;
  paired: boolean;
  lastSeenAt?: number;
  online?: boolean;
  pairingState?: 'unpaired' | 'paired';
};

const STORAGE_KEY = 'nexus-plus.remote-control.connections.v1';

function createId(type: RemoteDeviceType) {
  return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function getRemoteConnections(): Promise<RemoteConnection[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed as RemoteConnection[] : [];
  } catch {
    return [];
  }
}

export async function markRemoteDeviceOnline(id: string, online: boolean): Promise<void> {
  const current = await getRemoteConnections();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current.map((item) => item.id === id ? { ...item, online, lastSeenAt: online ? Date.now() : item.lastSeenAt } : item)));
}

export async function saveRemoteConnection(connection: RemoteConnection): Promise<void> {
  const current = await getRemoteConnections();
  const next = [...current.filter((item) => item.id !== connection.id), connection];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export async function removeRemoteConnection(id: string): Promise<void> {
  const next = (await getRemoteConnections()).filter((item) => item.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function createRemoteConnection(input: Omit<RemoteConnection, 'id' | 'paired' | 'pairingState'> & { paired?: boolean; pairingState?: 'unpaired' | 'paired' }): RemoteConnection {
  const paired = input.paired ?? true;
  return { ...input, id: createId(input.type), paired, pairingState: input.pairingState ?? (paired ? 'paired' : 'unpaired') };
}

export function getDefaultCapabilities(type: RemoteDeviceType, transport: RemoteTransport): RemoteCapabilities {
  if (type === 'computer') {
    return {
      keyboard: true,
      mouse: true,
      voice: true,
      media: true,
      navigation: true,
    };
  }
  return {
    power: true,
    volume: true,
    navigation: true,
    keypad: true,
    keyboard: true,
    voice: true,
    ir: transport === 'ir',
    media: true,
  };
}
