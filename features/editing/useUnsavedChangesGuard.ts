import { useCallback } from 'react';
import { Alert } from 'react-native';

export interface UnsavedChangesGuardOptions {
  hasChanges: boolean;
  onSave: () => Promise<void> | void;
  onDiscard: () => void;
  title?: string;
}

export function useUnsavedChangesGuard({
  hasChanges,
  onSave,
  onDiscard,
  title = 'Unsaved changes',
}: UnsavedChangesGuardOptions) {
  return useCallback(() => {
    if (!hasChanges) {
      onDiscard();
      return true;
    }

    Alert.alert(
      title,
      'What would you like to do with this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: onDiscard },
        { text: 'Save', onPress: () => void onSave() },
      ],
    );
    return true;
  }, [hasChanges, onDiscard, onSave, title]);
}
