import { Platform } from 'react-native';

export type SketchAiCapability = {
  supported: boolean;
  reason: 'supported' | 'web' | 'legacy-android' | 'low-memory' | 'unknown';
};

const MIN_ANDROID_API = 29;
const MIN_RAM_BYTES = 2 * 1024 * 1024 * 1024;

export function getSketchAiCapability(): SketchAiCapability {
  if (Platform.OS === 'web') return { supported: false, reason: 'web' };
  if (Platform.OS !== 'android') return { supported: true, reason: 'supported' };
  const constants = Platform.constants as Record<string, unknown>;
  const apiLevel = typeof constants.Version === 'number' ? constants.Version : typeof constants.Release === 'number' ? constants.Release : null;
  const totalMemory = typeof constants.totalMemory === 'number' ? constants.totalMemory : null;
  if (apiLevel !== null && apiLevel < MIN_ANDROID_API) return { supported: false, reason: 'legacy-android' };
  if (totalMemory !== null && totalMemory > 0 && totalMemory < MIN_RAM_BYTES) return { supported: false, reason: 'low-memory' };
  return { supported: true, reason: 'supported' };
}
