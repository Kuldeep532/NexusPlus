import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import type { FileManagerEntry } from './FileManagerTypes';

export async function openWithSystem(entry: FileManagerEntry): Promise<void> {
  if (entry.isDirectory) throw new Error('Folders must be opened inside File Manager.');

  if (entry.uri.startsWith('content://') && IntentLauncher.startActivityAsync) {
    try {
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: entry.uri,
        flags: 1,
      });
      return;
    } catch {
      // Fall through to the platform sharing/open chooser.
    }
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(entry.uri);
    return;
  }

  throw new Error('No compatible system viewer is available for this file.');
}
