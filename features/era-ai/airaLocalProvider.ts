import { getLocalInferenceEngine } from '@/features/nexus-assistant/localInference';
import { downloadAssistantModel, getAssistantModelPath } from '@/features/nexus-assistant/modelManager';
import { NEXUS_CORE_MODEL_ID } from '@/features/nexus-assistant/assistantConfig';
import type { EraLanguage } from './eraAiTypes';

export async function generateAiraLocally(input: {
  message: string;
  language: EraLanguage;
  gitaContext?: string;
  sourceContext?: string;
}): Promise<string | null> {
  try {
    let modelPath = getAssistantModelPath(NEXUS_CORE_MODEL_ID);
    if (!modelPath) {
      await downloadAssistantModel(NEXUS_CORE_MODEL_ID);
      modelPath = getAssistantModelPath(NEXUS_CORE_MODEL_ID);
    }
    if (!modelPath) return null;

    const engine = await getLocalInferenceEngine();
    if (!(await engine.isAvailable())) return null;

    await engine.loadModel(modelPath, NEXUS_CORE_MODEL_ID);
    let output = '';
    try {
      await engine.stream(
        [
          {
            role: 'system',
            content: [
              'You are Aira, a spiritual guidance assistant inside Nexus Plus.',
              'Answer only spiritual, Bhagavad Gita, reflection, meditation, dharma, karma, habit-improvement and personal-growth questions.',
              'Use the supplied Gita context as evidence. Do not invent quotations or citations.',
              'Answer in the requested language. Keep the response practical, compassionate and accessible.',
            ].join(' '),
          },
          {
            role: 'user',
            content: [
              'Language: ' + (input.language === 'hi' ? 'Hindi' : 'English'),
              'Question: ' + input.message,
              'Gita context: ' + (input.gitaContext || 'none'),
              'Editable spiritual source: ' + (input.sourceContext || 'none'),
            ].join('\n'),
          },
        ],
        { modelId: NEXUS_CORE_MODEL_ID, maxTokens: 220, temperature: 0.45, contextSize: 1536 },
        (chunk) => {
          if (chunk.type === 'token') output += chunk.text;
        },
      );
    } finally {
      await engine.unloadModel();
    }
    return output.trim() || null;
  } catch {
    return null;
  }
}
