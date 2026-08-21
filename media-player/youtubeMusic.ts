import { Linking } from 'react-native';

export interface YouTubeMusicSearchResult {
  title: string;
  uri: string;
}

type YouTubeMusicBridge = {
  isInstalled?: () => Promise<boolean>;
  search?: (query: string) => Promise<YouTubeMusicSearchResult[]>;
  play?: (uri: string) => Promise<boolean>;
};

function bridge(): YouTubeMusicBridge | undefined {
  return (globalThis as typeof globalThis & { NexusYouTubeMusic?: YouTubeMusicBridge }).NexusYouTubeMusic;
}

export async function isYouTubeMusicInstalled(): Promise<boolean> {
  const native = bridge();
  if (native?.isInstalled) return native.isInstalled();
  return false;
}

export async function searchYouTubeMusic(query: string): Promise<YouTubeMusicSearchResult[]> {
  const clean = query.trim();
  if (!clean) return [];
  return (await bridge()?.search?.(clean)) ?? [];
}

export async function openYouTubeMusicSearch(query: string): Promise<boolean> {
  const clean = query.trim();
  if (!clean) return false;
  const installed = await isYouTubeMusicInstalled();
  if (!installed) return false;
  const encoded = encodeURIComponent(clean);
  // Android native bridge should resolve this to the installed YT Music
  // package. The web URL is intentionally not used as an in-player source.
  return Linking.openURL(`youtubemusic://search?q=${encoded}`).then(() => true).catch(() => false);
}

export async function handoffYouTubeMusic(uri: string): Promise<boolean> {
  const native = bridge();
  if (native?.play) return native.play(uri);
  return Linking.openURL(uri).then(() => true).catch(() => false);
}
