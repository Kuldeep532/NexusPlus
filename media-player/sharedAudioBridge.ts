import type { MediaItemModel } from './types';

/**
 * Adapter boundary for existing Media Player audio items.
 * The actual playback owner is PersistentMediaController mounted at the app root.
 * This keeps Gita Nexus and Nexus Plus from creating independent audio engines.
 */
export function normalizeSharedAudioItem(item: MediaItemModel): MediaItemModel {
  if (item.kind !== 'audio') return item;
  return { ...item, source: item.source ?? 'local' };
}
