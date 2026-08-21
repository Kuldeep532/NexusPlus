import type { MediaItemModel } from '../types';
import { createVocalRemovalEngines } from './engines';
import type { VocalRemovalEngine, VocalRemovalJob, VocalRemovalOptions, VocalRemovalResult } from './types';

const DEFAULT_OPTIONS: VocalRemovalOptions = {
  quality: 'balanced',
  outputStem: 'instrumental',
  preserveBass: true,
  preserveStereo: true,
  chunkSeconds: 12,
};

export class VocalRemoverService {
  private readonly engines: VocalRemovalEngine[];
  private activeEngine: VocalRemovalEngine | null = null;

  constructor(engines: VocalRemovalEngine[] = createVocalRemovalEngines()) {
    this.engines = engines;
  }

  async getAvailableEngines(): Promise<VocalRemovalEngine[]> {
    const available: VocalRemovalEngine[] = [];
    for (const engine of this.engines) {
      if (await engine.isAvailable()) available.push(engine);
    }
    return available;
  }

  async removeVocals(
    source: MediaItemModel,
    options: Partial<VocalRemovalOptions> = {},
    onJobUpdate?: (job: VocalRemovalJob) => void,
  ): Promise<VocalRemovalResult> {
    if (source.kind !== 'audio') {
      throw new Error('Vocal removal is available for audio tracks only.');
    }

    const merged = { ...DEFAULT_OPTIONS, ...options };
    const job: VocalRemovalJob = {
      id: `vocal-${Date.now()}`,
      source,
      options: merged,
      status: 'preparing',
      progress: 0,
    };
    onJobUpdate?.(job);

    const available = await this.getAvailableEngines();
    if (!available.length) throw new Error('No vocal-removal engine is available.');

    // Prefer the AI engine. The fallback remains available for builds without
    // the native ML runtime.
    const engine = available.find((candidate) => candidate.id === 'native-ai') ?? available[0];
    this.activeEngine = engine;

    try {
      const output = await engine.separate(source.uri, merged, (progress) => {
        job.status = progress.stage;
        job.progress = progress.progress;
        onJobUpdate?.({ ...job });
      });

      const result: VocalRemovalResult = {
        source,
        outputUri: output.outputUri,
        stem: merged.outputStem,
        engine: engine.id,
        quality: merged.quality,
        durationMs: output.durationMs ?? source.durationMs,
      };
      job.status = 'complete';
      job.progress = 1;
      job.result = result;
      onJobUpdate?.({ ...job });
      return result;
    } catch (error) {
      job.status = 'error';
      job.error = error instanceof Error ? error.message : String(error);
      onJobUpdate?.({ ...job });
      throw error;
    } finally {
      await engine.dispose();
      this.activeEngine = null;
    }
  }

  async cancel(): Promise<void> {
    await this.activeEngine?.cancel();
  }
}

export const vocalRemoverService = new VocalRemoverService();
