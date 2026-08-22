import { getChapterSummaryAudioAsset, type GeetaFirebaseAsset } from './geetaFirebaseAssetManifest';

export interface FirebaseDownloadResolver {
  resolveDownloadUrl(asset: GeetaFirebaseAsset): Promise<string>;
}

/**
 * Converts the stable Storage path manifest into a concrete download URL.
 * The actual Firebase SDK/configuration is injected by the app layer.
 */
export async function resolveGeetaChapterAudioUrl(
  chapter: number,
  resolver: FirebaseDownloadResolver,
): Promise<string | null> {
  const asset = getChapterSummaryAudioAsset(chapter);
  if (!asset) return null;
  return resolver.resolveDownloadUrl(asset);
}
