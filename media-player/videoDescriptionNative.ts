import { NativeModulesProxy } from 'expo-modules-core';

export type NativeVideoDescriptionModule = {
  isOpenCvAvailable?: () => Promise<boolean>;
  describeVideoFrame?: (input: { videoUri: string; timestampMs: number; language: 'hi' | 'en' }) => Promise<{ text: string; confidence?: number } | null>;
};

export function getNativeVideoDescriptionModule(): NativeVideoDescriptionModule | null {
  const module = (NativeModulesProxy as Record<string, unknown>).NexusVideoDescription;
  return module && typeof module === 'object' ? module as NativeVideoDescriptionModule : null;
}
