import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PcOs } from './remoteProtocol';

export type PairedPc = {
  deviceId: string;
  displayName: string;
  os: PcOs;
  host: string;
  port: number;
  token: string;
  pairedAt: number;
};

const STORAGE_KEY = 'nexus-plus:pc-remote:paired-devices:v1';

export async function loadPairedPcs(): Promise<PairedPc[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as PairedPc[]) : [];
  } catch {
    return [];
  }
}

export async function savePairedPcs(devices: PairedPc[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(devices));
}

export async function upsertPairedPc(device: PairedPc): Promise<void> {
  const existing = await loadPairedPcs();
  const next = existing.filter((item) => item.deviceId !== device.deviceId);
  next.push(device);
  await savePairedPcs(next);
}

export async function removePairedPc(deviceId: string): Promise<void> {
  const existing = await loadPairedPcs();
  await savePairedPcs(existing.filter((item) => item.deviceId !== deviceId));
}
