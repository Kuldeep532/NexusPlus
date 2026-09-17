import * as Clipboard from 'expo-clipboard';

export async function copyAccessibleText(text: string): Promise<boolean> {
  const normalized = text.trim();
  if (!normalized) return false;
  await Clipboard.setStringAsync(normalized);
  return true;
}
