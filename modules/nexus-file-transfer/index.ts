import { requireNativeModule } from 'expo-modules-core';

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

const Native = requireNativeModule('NexusFileTransfer') as {
  start(role: 'send' | 'receive'): Promise<boolean>;
  connect(endpointId: string): Promise<boolean>;
  accept(endpointId: string): Promise<boolean>;
  reject(endpointId: string): Promise<boolean>;
  queueFile(uri: string, name: string, mime: string): Promise<Record<string, string>>;
  getState(): Promise<FileTransferState>;
  stop(): Promise<boolean>;
};

export const NexusFileTransfer = Native;
