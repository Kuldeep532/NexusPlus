import { NativeModules } from 'react-native';

export type RemoteAction =
  | { kind: 'button'; key: string }
  | { kind: 'text'; text: string }
  | { kind: 'pointer'; action: 'move' | 'down' | 'up'; x?: number; y?: number; button?: 'left' | 'right' }
  | { kind: 'voice'; text: string };

type NativeRemoteModule = {
  isAvailable?: () => Promise<boolean>;
  send?: (device: Record<string, unknown>, action: RemoteAction) => Promise<boolean>;
};

const native = NativeModules.NexusRemote as NativeRemoteModule | undefined;

export async function sendRemoteAction(device: Record<string, unknown>, action: RemoteAction): Promise<boolean> {
  if (!native?.send) {
    throw new Error('Remote control native transport is not available in this Android build.');
  }
  return native.send(device, action);
}

export async function isRemoteTransportAvailable(): Promise<boolean> {
  if (!native?.isAvailable) return false;
  try {
    return Boolean(await native.isAvailable());
  } catch {
    return false;
  }
}
