import { NativeModules, Platform } from 'react-native';

export type MediaVoiceAction = 'play' | 'pause' | 'seek-forward' | 'seek-backward' | 'stop';

type NativeMedia = {
  isAvailable?: () => Promise<boolean>;
  pause?: () => Promise<boolean>;
  resume?: () => Promise<boolean>;
  stop?: () => Promise<boolean>;
  seekTo?: (positionMs: number) => Promise<boolean>;
};

const nativeMedia = NativeModules.NexusMedia as NativeMedia | undefined;

export function parseMediaVoiceCommand(text: string): MediaVoiceAction | null {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return null;
  if (/\b(pause|pause video|वीडियो.*पॉज़|पॉज़)\b/i.test(normalized)) return 'pause';
  if (/\b(play|play video|resume|वीडियो.*चलाओ|प्ले)\b/i.test(normalized)) return 'play';
  if (/\b(stop|stop video|वीडियो.*बंद)\b/i.test(normalized)) return 'stop';
  if (/\b(fast forward|forward|skip ahead|10 seconds forward|आगे.*10|फास्ट फॉरवर्ड)\b/i.test(normalized)) return 'seek-forward';
  if (/\b(rewind|go back|10 seconds back|back 10 seconds|पीछे.*10|रीवाइंड)\b/i.test(normalized)) return 'seek-backward';
  return null;
}

export async function executeMediaVoiceCommand(action: MediaVoiceAction, seekSeconds = 10): Promise<boolean> {
  if (Platform.OS !== 'android' || !nativeMedia) return false;
  try {
    if (action === 'pause') return Boolean(await nativeMedia.pause?.());
    if (action === 'play') return Boolean(await nativeMedia.resume?.());
    if (action === 'stop') return Boolean(await nativeMedia.stop?.());
    const deltaMs = Math.max(1, Math.min(60, seekSeconds)) * 1000;
    // Native seek is absolute, so this command only works when the media service
    // already exposes a current position API. Keep the action parser ready without
    // guessing a position or touching unrelated apps.
    return false;
  } catch {
    return false;
  }
}
