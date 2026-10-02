import { NativeModules } from 'react-native';

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

type NativeLocalAi = {
  getStatus(): Promise<{ available: boolean; version: string }>;
  load(modelId: string, modelPath: string): Promise<unknown>;
  unload(modelId: string): Promise<void>;
  generate: (
    modelId: string,
    messages: LocalInferenceMessage[],
    options: LocalInferenceOptions,
  ) => Promise<string>;
};

const nativeLocalAi = NativeModules.NexusAssistantOnnx as NativeLocalAi | undefined;
let enginePromise: Promise<LocalInferenceEngine> | null = null;

export type LocalInferenceEngine = {
  isAvailable(): Promise<boolean>;
  loadModel(modelPath: string, modelId: string): Promise<void>;
  unloadModel(): Promise<void>;
  stream(messages: LocalInferenceMessage[], options: LocalInferenceOptions, onChunk: (chunk: LocalInferenceChunk) => void): Promise<void>;
};

export function getLocalInferenceEngine(): Promise<LocalInferenceEngine> {
  if (!enginePromise) enginePromise = Promise.resolve(createEngine());
  return enginePromise;
}

function createEngine(): LocalInferenceEngine {
  return {
    async isAvailable() {
      if (!nativeLocalAi) return false;
      try {
        const status = await nativeLocalAi.getStatus();
        return Boolean(status.available);
      } catch {
        return false;
      }
    },
    async loadModel(modelPath, modelId) {
      if (!nativeLocalAi) throw new Error('Local AI runtime is not available in this build.');
      await nativeLocalAi.load(modelId, modelPath);
    },
    async unloadModel() {},
    async stream(messages, options, onChunk) {
      if (!nativeLocalAi) throw new Error('Local AI runtime is not available in this build.');
      onChunk({ type: 'status', text: 'Running local AI on this device…' });
      let text: string;
      try {
        text = (await nativeLocalAi.generate(options.modelId, messages, options)).trim();
      } catch (error) {
        throw error instanceof Error ? error : new Error('Local AI could not generate a response.');
      }
      if (text) onChunk({ type: 'token', text });
      onChunk({ type: 'done' });
    },
  };
}