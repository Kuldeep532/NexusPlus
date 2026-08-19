import * as MediaLibrary from 'expo-media-library';
import type { MediaItemModel } from './types';

function assetToMediaItem(asset: MediaLibrary.Asset): MediaItemModel {
  const isVideo = asset.mediaType === MediaLibrary.MediaType.video;
  return {
    id: asset.id,
    uri: asset.uri,
    kind: isVideo ? 'video' : 'audio',
    title: asset.filename.replace(/\.[^.]+$/, '') || 'Untitled',
    durationMs: Math.round((asset.duration || 0) * 1000),
    artworkUri: asset.uri,
    isLocal: true,
    mimeType: asset.mediaType,
  };
}

export async function requestMediaPermission(): Promise<boolean> {
  const current = await MediaLibrary.getPermissionsAsync();
  if (current.granted || current.accessPrivileges === 'all') return true;
  const next = await MediaLibrary.requestPermissionsAsync();
  return next.granted || next.accessPrivileges === 'all';
}

async function getAllAssets(mediaType: MediaLibrary.MediaType): Promise<MediaLibrary.Asset[]> {
  const output: MediaLibrary.Asset[] = [];
  let after: string | undefined;

  do {
    const page = await MediaLibrary.getAssetsAsync({
      mediaType,
      first: 200,
      after,
      sortBy: [[MediaLibrary.SortBy.default, false]],
    });
    output.push(...page.assets);
    after = page.hasNextPage ? page.endCursor : undefined;
  } while (after);

  return output;
}

export async function scanLocalMedia() {
  const granted = await requestMediaPermission();
  if (!granted) {
    return { permissionGranted: false, audio: [], video: [] };
  }

  const [audioAssets, videoAssets] = await Promise.all([
    getAllAssets(MediaLibrary.MediaType.audio),
    getAllAssets(MediaLibrary.MediaType.video),
  ]);

  return {
    permissionGranted: true,
    audio: audioAssets.map(assetToMediaItem),
    video: videoAssets.map(assetToMediaItem),
  };
}
