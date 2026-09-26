import { NativeModules, Platform } from 'react-native';

export type MusicAction = 'play' | 'pause' | 'resume' | 'next' | 'previous' | 'stop';

export type MusicIntent = {
  action: MusicAction;
  query?: string;
  appPackage?: string;
};

const MUSIC_COMMANDS: Array<{ action: MusicAction; patterns: RegExp[] }> = [
  { action: 'stop', patterns: [/\bstop (?:the )?(?:song|music|track)\b/i, /गाना\s*(?:बंद|रोक)\s*(?:करो)?/i, /म्यूजिक\s*(?:बंद|रोक)/i] },
  { action: 'pause', patterns: [/\bpause (?:the )?(?:song|music|track)\b/i, /गाना\s*पॉज/i, /म्यूजिक\s*पॉज/i] },
  { action: 'resume', patterns: [/\b(?:resume|continue|play again)\b/i, /गाना\s*(?:चलाओ|जारी)/i, /म्यूजिक\s*(?:चलाओ|जारी)/i] },
  { action: 'next', patterns: [/\b(?:next|skip|next song|अगला गाना)\b/i, /अगला\s*(?:गाना|ट्रैक)/i] },
  { action: 'previous', patterns: [/\b(?:previous|prev|previous song|पिछला गाना)\b/i, /पिछला\s*(?:गाना|ट्रैक)/i] },
];

export function parseMusicIntent(text: string): MusicIntent | null {
  const normalized = text.trim();
  if (!normalized) return null;

  for (const candidate of MUSIC_COMMANDS) {
    if (candidate.patterns.some((pattern) => pattern.test(normalized))) return { action: candidate.action };
  }

  const playMatch = normalized.match(/^(?:play|चलाओ|बजाओ|प्ले)\s+(.+)$/i);
  if (playMatch?.[1]?.trim()) return { action: 'play', query: playMatch[1].trim() };

  const likelySongQuery = /^(?:song|गाना)\s*[:：-]\s*(.+)$/i.exec(normalized);
  if (likelySongQuery?.[1]?.trim()) return { action: 'play', query: likelySongQuery[1].trim() };

  return null;
}

type NativeMusicBridge = {
  listMusicApps?: () => Promise<Array<{ packageName: string; label: string }>>;
  playFromSearch?: (query: string, packageName?: string) => Promise<boolean>;
  sendMediaKey?: (action: MusicAction) => Promise<boolean>;
};

const native = NativeModules.NexusMusic as NativeMusicBridge | undefined;

export async function listInstalledMusicApps() {
  if (Platform.OS !== 'android' || !native?.listMusicApps) return [];
  return native.listMusicApps();
}

export async function executeNativeMusicIntent(intent: MusicIntent): Promise<boolean> {
  if (Platform.OS !== 'android' || !native) return false;

  if (intent.action === 'play') {
    if (!intent.query || !native.playFromSearch) return false;
    return native.playFromSearch(intent.query, intent.appPackage);
  }

  return native.sendMediaKey?.(intent.action) ?? false;
}
