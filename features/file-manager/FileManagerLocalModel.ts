export type FileManagerLocalModelCapability = 'classify' | 'summarize' | 'extract' | 'rename';

export type FileManagerLocalModel = {
  id: string;
  version: string;
  sizeEstimateBytes: number;
  runtime: 'on-device';
  capabilities: readonly FileManagerLocalModelCapability[];
  infer(text: string, capability: FileManagerLocalModelCapability): string;
};

/**
 * Tiny deterministic local model used as the built-in fallback.
 * It intentionally contains no network client and no remote inference path.
 * A future quantized embedded model can implement the same interface.
 */
export const FILE_MANAGER_LOCAL_MODEL: FileManagerLocalModel = {
  id: 'nexus-file-model-small',
  version: '1.0.0',
  sizeEstimateBytes: 1024 * 1024,
  runtime: 'on-device',
  capabilities: ['classify', 'summarize', 'extract', 'rename'],
  infer(text, capability) {
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (!normalized) return 'No readable text was found.';
    if (capability === 'summarize') return (normalized.match(/[^.!?]+[.!?]+/g) ?? [normalized]).slice(0, 3).join(' ').slice(0, 900);
    if (capability === 'extract') return normalized.slice(0, 4000);
    if (capability === 'rename') return normalized.split(/[.!?]/)[0].replace(/[^a-zA-Z0-9 _-]/g, '').trim().slice(0, 70) || 'Nexus File';
    return normalized.slice(0, 240);
  },
};
