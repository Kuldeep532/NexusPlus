import { requireOptionalNativeModule } from 'expo-modules-core';

export type NearbyDevice = { id: string; name: string };
export type PendingConnection = { id: string; name: string; code: string };
export type FileTransferState = {
  mode: 'idle' | 'send' | 'receive' | string;
  status: string;
  error?: string | null;
  devices: NearbyDevice[];
  pending: PendingConnection[];
  connected: boolean;
  progress: number;
  total: number;
  received: Array<{ name: string; path: string; mime?: string; size: number }>;
};

type NativeApi = {
  start(role: 'send' | 'receive'): Promise<boolean>;
  connect(endpointId: string): Promise<boolean>;
  accept(endpointId: string): Promise<boolean>;
  reject(endpointId: string): Promise<boolean>;
  queueFile(uri: string, name: string, mime: string): Promise<Record<string, string>>;
  getState(): Promise<FileTransferState>;
  stop(): Promise<boolean>;
};

const native = requireOptionalNativeModule<NativeApi>('NexusFileTransfer');
const unavailable = async (): Promise<never> => { throw new Error('Send File is available in the Android native build of Nexus Plus.'); };

export const NexusFileTransfer: NativeApi = native ?? {
  start: unavailable,
  connect: unavailable,
  accept: unavailable,
  reject: unavailable,
  queueFile: unavailable,
  getState: async () => ({ mode: 'idle', status: 'unavailable', devices: [], pending: [], connected: false, progress: 0, total: 0, received: [] }),
  stop: async () => true,
};
