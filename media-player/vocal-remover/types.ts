import type { MediaItemModel } from '../types';

export type VocalRemovalEngineId = 'onnx-demucs' | 'native-ai' | 'phase-cancel';
export type VocalRemovalQuality = 'preview' | 'balanced' | 'studio';
export type VocalStem = 'vocals' | 'instrumental';

export interface VocalRemovalOptions {
  quality: VocalRemovalQuality;
  outputStem: VocalStem;
  preserveBass: boolean;
  preserveStereo: boolean;
  chunkSeconds?: number;
}

export interface VocalRemovalProgress {
  stage: 'preparing' | 'separating' | 'encoding' | 'complete' | 'error';
  progress: number;
  message?: string;
}

export interface VocalRemovalResult {
  source: MediaItemModel;
  outputUri: string;
  stem: VocalStem;
  engine: VocalRemovalEngineId;
  quality: VocalRemovalQuality;
  durationMs?: number;
}

export interface VocalRemovalEngine {
  readonly id: VocalRemovalEngineId;
  readonly displayName: string;
  readonly isAvailable: () => Promise<boolean>;
  separate(
    inputUri: string,
    options: VocalRemovalOptions,
    onProgress?: (progress: VocalRemovalProgress) => void,
  ): Promise<{ outputUri: string; durationMs?: number }>;
  cancel(): Promise<void>;
  dispose(): Promise<void>;
}

export interface VocalRemovalJob {
  id: string;
  source: MediaItemModel;
  options: VocalRemovalOptions;
  status: VocalRemovalProgress['stage'];
  progress: number;
  result?: VocalRemovalResult;
  error?: string;
}
