import { createAudioPlayer } from 'expo-audio';
import { DOCUMENT_PROCESSING_SOUND } from './audioAssets';

let player: ReturnType<typeof createAudioPlayer> | null = null;

export async function playDocumentProcessingSound(): Promise<void> {
  try {
    player?.remove();
    player = createAudioPlayer(DOCUMENT_PROCESSING_SOUND);
    player.volume = 1;
    player.play();
  } catch {
    // Processing should continue even when the optional cue cannot be played.
  }
}
