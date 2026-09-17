import { NativeModules } from 'react-native';

export type NativeVideoOperation = {
  type: 'audio-to-video';
  audioUri: string;
  images: Array<{ uri: string; durationMs: number }>;
  outputUri: string;
};

export type NativeVideoResult = {
  outputUri?: string;
  durationMs?: number;
};

type NativeVideoEditorModule = {
  isAvailable: () => Promise<boolean>;
  execute: (operation: NativeVideoOperation) => Promise<NativeVideoResult>;
};

const NativeVideoEditor = NativeModules.NexusVideoEditor as NativeVideoEditorModule | undefined;

export async function runNativeVideoOperation(operation: NativeVideoOperation): Promise<NativeVideoResult> {
  if (!NativeVideoEditor) throw new Error('Native audio-to-video module is unavailable in this build.');
  const available = await NativeVideoEditor.isAvailable();
  if (!available) throw new Error('Native audio-to-video module is unavailable on this Android build.');
  return NativeVideoEditor.execute(operation);
}
