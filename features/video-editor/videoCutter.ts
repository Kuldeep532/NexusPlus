import { File, Paths } from 'expo-file-system';
import { runNativeVideoOperation } from './native/videoEditorNativeBridge';

export type VideoCutterRequest = {
  inputUri: string;
  startMs: number;
  endMs: number;
};

export type VideoCutterResult = {
  outputUri: string;
  removedStartMs: number;
  removedEndMs: number;
  sourceDurationMs: number | null;
  outputDurationMs: number | null;
};

function assertBounds({ startMs, endMs }: Pick<VideoCutterRequest, 'startMs' | 'endMs'>) {
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) throw new Error('Cut bounds must be finite.');
  if (startMs < 0) throw new Error('Cut start must be at least 0 ms.');
  if (endMs <= startMs) throw new Error('Cut end must be greater than cut start.');
}

function createOutputUri(): string {
  const name = `video-cut-${Date.now()}.mp4`;
  return new File(Paths.cache, name).uri;
}

export async function removeVideoSegment(request: VideoCutterRequest): Promise<VideoCutterResult> {
  assertBounds(request);
  const outputUri = createOutputUri();
  const result = await runNativeVideoOperation({
    type: 'remove-segment',
    inputUri: request.inputUri,
    startMs: request.startMs,
    endMs: request.endMs,
    outputUri,
  });

  return {
    outputUri: result.outputPath ?? outputUri,
    removedStartMs: result.removedStartMs ?? request.startMs,
    removedEndMs: result.removedEndMs ?? request.endMs,
    sourceDurationMs: result.sourceDurationMs ?? null,
    outputDurationMs: result.outputDurationMs ?? null,
  };
}
