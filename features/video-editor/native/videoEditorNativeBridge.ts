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
};

/**
 * Native boundary for video rendering. The feature layer owns metadata only; render work stays native.
 * The current checked-in native bridge does not yet expose a real Android/JNI implementation, so callers
 * receive an explicit capability error instead of a fabricated output file.
 */
export async function runNativeVideoOperation(operation: NativeVideoOperation): Promise<NativeVideoResult> {
  if (operation.type === 'audio-to-video') {
    throw new Error('Audio to Video native renderer is not installed in this build yet.');
  }
  throw new Error(`Native video operation "${operation.type}" is not installed in this build yet.`);
}
