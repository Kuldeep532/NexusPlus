import type { MediaItemModel, MediaPlaylist } from './types';

type PlaylistBridge = {
  getDevicePlaylists?: () => Promise<MediaPlaylist[]>;
  createDevicePlaylist?: (name: string, itemIds: string[]) => Promise<MediaPlaylist>;
  addToDevicePlaylist?: (playlistId: string, itemIds: string[]) => Promise<void>;
};

function bridge(): PlaylistBridge | undefined {
  return (globalThis as typeof globalThis & { NexusMediaPlaylists?: PlaylistBridge }).NexusMediaPlaylists;
}

export async function loadDevicePlaylists(): Promise<MediaPlaylist[]> {
  return (await bridge()?.getDevicePlaylists?.()) ?? [];
}

export async function createPlaylist(name: string, items: MediaItemModel[] = []): Promise<MediaPlaylist> {
  const cleanName = name.trim();
  if (!cleanName) throw new Error('Playlist name is required.');
  const itemIds = items.map((item) => item.id);
  const native = await bridge()?.createDevicePlaylist?.(cleanName, itemIds);
  return native ?? { id: `nexus-${Date.now()}`, name: cleanName, itemIds, isDevicePlaylist: false };
}

export async function addToPlaylist(playlist: MediaPlaylist, items: MediaItemModel[]): Promise<void> {
  const ids = items.map((item) => item.id);
  if (playlist.isDevicePlaylist) {
    await bridge()?.addToDevicePlaylist?.(playlist.id, ids);
  }
  playlist.itemIds = [...new Set([...playlist.itemIds, ...ids])];
}
