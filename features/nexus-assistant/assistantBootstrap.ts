import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { NEXUS_CORE_MODEL_ID } from './assistantConfig';
import { downloadAssistantModel } from './modelManager';

const RETRY_AFTER_MS = 5 * 60 * 1000;
const NEXT_RETRY_KEY = 'nexus-plus.assistant.core-model.next-retry.v1';
let running = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

export type AssistantBootstrapResult = 'ready' | 'skipped' | 'failed';

async function shouldRetryNow(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(NEXT_RETRY_KEY);
  if (!raw) return true;
  const next = Number(raw);
  return !Number.isFinite(next) || Date.now() >= next;
}

function scheduleRetry(): void {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void ensureNexusCoreModel();
  }, RETRY_AFTER_MS);
}

export async function ensureNexusCoreModel(): Promise<AssistantBootstrapResult> {
  if (running) return 'skipped';
  if (!(await shouldRetryNow())) return 'skipped';

  running = true;
  try {
    await downloadAssistantModel(NEXUS_CORE_MODEL_ID);
    await AsyncStorage.removeItem(NEXT_RETRY_KEY);
    return 'ready';
  } catch {
    await AsyncStorage.setItem(NEXT_RETRY_KEY, String(Date.now() + RETRY_AFTER_MS));
    scheduleRetry();
    return 'failed';
  } finally {
    running = false;
  }
}

/** Start a quiet first-launch/background attempt without blocking the UI. */
export function startAssistantBootstrap(): () => void {
  const run = () => { void ensureNexusCoreModel(); };
  run();
  const subscription = AppState.addEventListener('change', (state) => {
    if (state === 'active') run();
  });
  return () => {
    subscription.remove();
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
  };
}
