import * as Speech from 'expo-speech';

export async function announceRemoteSelection(label: string): Promise<void> {
  if (!label.trim()) return;
  try {
    await Speech.stop();
    await Speech.speak(label, { rate: 0.9, pitch: 1 });
  } catch {
    // Phone accessibility services such as TalkBack remain the primary navigation feedback.
  }
}
