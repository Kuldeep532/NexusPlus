import { addMessage, listMessages, type ChatMessage } from './assistantStore';
import { getLocalInferenceEngine, type LocalInferenceChunk } from './localInference';

export type NexusAssistantReply = { messageId: number | null; text: string };

const DEFAULT_SYSTEM_PROMPT = [
  'You are Nexus Assistant, a private on-device assistant.',
  'Be concise, accurate, and accessible for a screen-reader user.',
  'Never claim that an action was completed unless a registered device action confirms it.',
  'Do not send conversation data to remote services from the local mode.',
].join(' ');

function toInferenceMessages(messages: ChatMessage[]) {
  return messages.map(({ role, content }) => ({ role, content }));
}

export async function streamAssistantReply(params: {
  sessionId: string;
  modelId: string;
  modelPath: string;
  userText: string;
  onToken?: (text: string) => void;
  onStatus?: (text: string) => void;
}): Promise<NexusAssistantReply> {
  const existing = await listMessages(params.sessionId);
  const inference = await getLocalInferenceEngine();
  if (!(await inference.isAvailable())) throw new Error('Local AI is not available on this device.');

  const prompt: ChatMessage[] = [
    { id: -1, sessionId: params.sessionId, role: 'system', content: DEFAULT_SYSTEM_PROMPT, createdAt: 0 },
    ...existing.slice(-12),
    { id: -1, sessionId: params.sessionId, role: 'user', content: params.userText, createdAt: Date.now() },
  ];

  let output = '';
  await inference.loadModel(params.modelPath, params.modelId);
  try {
    await inference.stream(toInferenceMessages(prompt), { modelId: params.modelId, maxTokens: 160, temperature: 0.35, contextSize: 1024 }, (chunk: LocalInferenceChunk) => {
      if (chunk.type === 'token') {
        output += chunk.text;
        params.onToken?.(chunk.text);
      } else if (chunk.type === 'status') {
        params.onStatus?.(chunk.text);
      }
    });
  } finally {
    await inference.unloadModel();
  }

  const text = output.trim();
  if (!text) throw new Error('The local assistant returned no answer.');
  await addMessage(params.sessionId, 'assistant', text);
  const saved = await listMessages(params.sessionId);
  return { messageId: saved.at(-1)?.id ?? null, text };
}