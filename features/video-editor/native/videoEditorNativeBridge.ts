import { NativeModules } from 'react-native';

export type NativeVideoOperation =
  | { type: 'probe'; inputUri: string }
  | { type: 'trim'; inputUri: string; startMs: number; endMs: number; outputUri: string }
  | { type: 'split'; inputUri: string; atMs: number; firstOutputUri: string; secondOutputUri: string }
  | { type: 'merge'; inputUris: string[]; outputUri: string }
  | { type: 'remove-segment'; inputUri: string; startMs: number; endMs: number; outputUri: string }
  | { type: 'remove-silence'; inputUri: string; thresholdDb: number; minSilenceMs: number; outputUri: string }
  | { type: 'speed'; inputUri: string; factor: number; outputUri: string }
  | { type: 'crop'; inputUri: string; aspectRatio: string; outputUri: string }
  | { type: 'rotate'; inputUri: string; degrees: 90 | 180 | 270; outputUri: string }
  | { type: 'flip'; inputUri: string; direction: 'horizontal' | 'vertical'; outputUri: string }
  | { type: 'audio-extract'; inputUri: string; outputUri: string }
  | { type: 'reverse'; inputUri: string; outputUri: string }
  | {
      type: 'audio-to-video';
      audioUri: string;
      images: Array<{ uri: string; durationMs: number }>;
      outputUri: string;
    };

export type NativeVideoResult = {
  outputUri?: string;
  durationMs?: number;
  detectedSilentRanges?: Array<{ startMs: number; endMs: number }>;
  outputPath?: string;
  removedStartMs?: number;
  removedEndMs?: number;
  sourceDurationMs?: number | null;
  outputDurationMs?: number | null;
  samples?: number;
  hadPostCutSamples?: boolean;
};

type NativeVideoEditorModule = {
  isAvailable: () => Promise<boolean>;
  execute: (operation: NativeVideoOperation) => Promise<NativeVideoResult>;
};

const NativeVideoEditor = NativeModules.NexusVideoEditor as NativeVideoEditorModule | undefined;

/** Native Android rendering boundary. Never fabricates an output when native processing is unavailable. */
export async function runNativeVideoOperation(operation: NativeVideoOperation): Promise<NativeVideoResult> {
  if (!NativeVideoEditor) throw new Error('Native video editor module is unavailable in this build.');
  const available = await NativeVideoEditor.isAvailable();
  if (!available) throw new Error('Native video editor is unavailable on this Android build.');
  return NativeVideoEditor.execute(operation);
}
