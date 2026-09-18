import * as Haptics from 'expo-haptics';

export async function documentHaptic(kind: 'tap' | 'success' | 'error' = 'tap'): Promise<void> {
  try {
    if (kind === 'success') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (kind === 'error') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch {
    // Haptics are optional on devices without vibration support.
  }
}
