export type NativeVideoOperation =
  | { type: 'probe'; inputUri: string }
  | { type: 'trim'; inputUri: string; startMs: number; endMs: number; outputUri: string }
  | { type: 'split'; inputUri: string; atMs: number; firstOutputUri: string; secondOutputUri: string }
  | { type: 'merge'; inputUris: string[]; outputUri: string }
  | { type: 'remove-silence'; inputUri: string; thresholdDb: number; minSilenceMs: number; outputUri: string }
  | { type: 'speed'; inputUri: string; factor: number; outputUri: string }
  | { type: 'crop'; inputUri: string; aspectRatio: string; outputUri: string }
  | { type: 'rotate'; inputUri: string; degrees: 90 | 180 | 270; outputUri: string }
  | { type: 'flip'; inputUri: string; direction: 'horizontal' | 'vertical'; outputUri: string }
  | { type: 'audio-extract'; inputUri: string; outputUri: string }
  | { type: 'reverse'; inputUri: string; outputUri: string };

export type NativeVideoResult = {
  outputUri?: string;
  durationMs?: number;
  detectedSilentRanges?: Array<{ startMs: number; endMs: number }>;
};

/**
 * Native boundary for future JSI/Android NDK implementation.
 * UI code must never call FFmpeg/NDK APIs directly.
 */
export async function runNativeVideoOperation(_operation: NativeVideoOperation): Promise<NativeVideoResult> {
  throw new Error('Native video engine is not installed in this build yet.');
}
