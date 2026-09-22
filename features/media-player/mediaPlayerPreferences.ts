import AsyncStorage from '@react-native-async-storage/async-storage';

export type MediaPlayerPreferences = {
  videoDescriptionEnabled: boolean;
  videoDescriptionLanguage: 'auto' | 'hi' | 'en';
  ttsProvider: 'auto' | 'piper' | 'system';
  descriptionIntervalMs: 5000 | 7500 | 10000;
  autoPlay: boolean;
  backgroundPlayback: boolean;
  resumePosition: boolean;
  skipSeconds: 5 | 10 | 15 | 30;
  playbackRate: number;
  rememberVolume: boolean;
  defaultVolume: number;
  subtitlesEnabled: boolean;
  audioEffectPreset: 'normal' | 'lofi' | 'echo' | 'stereo-split';
};

const KEY = '@nexus-plus/media-player-preferences';
export const DEFAULT_MEDIA_PLAYER_PREFERENCES: MediaPlayerPreferences = {
  videoDescriptionEnabled: false,
  videoDescriptionLanguage: 'auto',
  ttsProvider: 'auto',
  descriptionIntervalMs: 5000,
  autoPlay: true,
  backgroundPlayback: true,
  resumePosition: true,
  skipSeconds: 10,
  playbackRate: 1,
  rememberVolume: true,
  defaultVolume: 1,
  subtitlesEnabled: true,
  audioEffectPreset: 'normal',
};

export async function readMediaPlayerPreferences(): Promise<MediaPlayerPreferences> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_MEDIA_PLAYER_PREFERENCES;
    const value = JSON.parse(raw) as Partial<MediaPlayerPreferences>;
    return {
      ...DEFAULT_MEDIA_PLAYER_PREFERENCES,
      ...value,
      descriptionIntervalMs: ([5000, 7500, 10000] as const).includes(value.descriptionIntervalMs as never)
        ? value.descriptionIntervalMs!
        : DEFAULT_MEDIA_PLAYER_PREFERENCES.descriptionIntervalMs,
      skipSeconds: ([5, 10, 15, 30] as const).includes(value.skipSeconds as never)
        ? value.skipSeconds!
        : DEFAULT_MEDIA_PLAYER_PREFERENCES.skipSeconds,
      playbackRate: Number.isFinite(value.playbackRate) ? Math.min(3, Math.max(.25, value.playbackRate!)) : 1,
      defaultVolume: Number.isFinite(value.defaultVolume) ? Math.min(1, Math.max(0, value.defaultVolume!)) : 1,
    };
  } catch {
    return DEFAULT_MEDIA_PLAYER_PREFERENCES;
  }
}

export async function writeMediaPlayerPreferences(next: MediaPlayerPreferences): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}
