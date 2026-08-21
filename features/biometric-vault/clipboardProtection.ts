import * as Clipboard from 'expo-clipboard';

let clearTimer: ReturnType<typeof setTimeout> | null = null;

export async function copySensitiveValue(value: string, clearAfterSeconds = 30): Promise<void> {
  if (clearTimer) clearTimeout(clearTimer);
  await Clipboard.setStringAsync(value);
  clearTimer = setTimeout(async () => {
    try {
      await Clipboard.setStringAsync('');
    } finally {
      clearTimer = null;
    }
  }, Math.max(1, clearAfterSeconds) * 1000);
}

export async function clearSensitiveClipboard(): Promise<void> {
  if (clearTimer) clearTimeout(clearTimer);
  clearTimer = null;
  await Clipboard.setStringAsync('');
}
