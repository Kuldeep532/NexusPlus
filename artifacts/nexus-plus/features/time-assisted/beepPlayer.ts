import { Audio } from 'expo-av';

const beepSource = require('../../assets/audio/time_assisted_beep.mp3');

let sound: Audio.Sound | null = null;

export async function playTimeAnnouncementBeep(): Promise<void> {
  try {
    if (sound) {
      await sound.unloadAsync().catch(() => undefined);
      sound = null;
    }

    const created = await Audio.Sound.createAsync(beepSource, {
      shouldPlay: true,
      volume: 0.9,
      isLooping: false,
    });
    sound = created.sound;
  } catch {
    // Announcement should continue even when the optional cue cannot play.
  }
}

export async function disposeTimeAnnouncementBeep(): Promise<void> {
  if (!sound) return;
  await sound.unloadAsync().catch(() => undefined);
  sound = null;
}
