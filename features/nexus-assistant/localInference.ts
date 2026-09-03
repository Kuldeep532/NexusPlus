export type LocalInferenceMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type LocalInferenceOptions = {
  modelId: string;
  maxTokens?: number;
  temperature?: number;
  contextSize?: number;
};

export type LocalInferenceChunk =
  | { type: 'token'; text: string }
  | { type: 'status'; text: string }
  | { type: 'done' }
  | { type: 'error'; message: string };

export type LocalInferenceEngine = {
  isAvailable(): Promise<boolean>;
  loadModel(modelPath: string, modelId: string): Promise<void>;
  unloadModel(): Promise<void>;
  stream(
    messages: LocalInferenceMessage[],
    options: LocalInferenceOptions,
    onChunk: (chunk: LocalInferenceChunk) => void,
  ): Promise<void>;
};

let enginePromise: Promise<LocalInferenceEngine> | null = null;

/**
 * Native Stage 2 bridge boundary.
 *
 * The JavaScript layer never implements inference itself. A future Android
 * native module is responsible for model loading and token streaming. Keeping
 * this boundary small lets us swap the native backend without changing chat,
 * SQLite, or agent/action layers.
 */
export function getLocalInferenceEngine(): Promise<LocalInferenceEngine> {
  if (!enginePromise) {
    enginePromise = Promise.resolve(createUnavailableEngine());
  }
  return enginePromise;
}

function createUnavailableEngine(): LocalInferenceEngine {
  return {
    async isAvailable() {
      return false;
    },
    async loadModel() {
      throw new Error('Local inference native engine is not installed on this build yet.');
    },
    async unloadModel() {
      // Safe no-op until the native engine is available.
    },
    async stream(_messages, _options, onChunk) {
      const message = 'Local inference engine is not available in this build yet.';
      onChunk({ type: 'error', message });
      throw new Error(message);
    },
  };
}
