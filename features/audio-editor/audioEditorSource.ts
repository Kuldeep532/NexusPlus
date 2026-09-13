import * as DocumentPicker from 'expo-document-picker';
import { scanLocalMedia } from '@/media-player/library';
import type { AudioEditorSource } from './types';

const AUDIO_TYPES = ['audio/*', 'video/*'];

export async function pickAudioFromFileManager(): Promise<AudioEditorSource | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: AUDIO_TYPES,
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  return {
    id: `document:${asset.uri}`,
    uri: asset.uri,
    name: asset.name || 'Untitled audio',
    durationMs: 0,
    mimeType: asset.mimeType,
    source: 'document',
  };
}

export async function discoverLocalAudio(query = ''): Promise<{ permissionGranted: boolean; audio: AudioEditorSource[] }> {
  const result = await scanLocalMedia();
  const normalized = query.trim().toLowerCase();
  const audio = result.audio
    .filter((item) => item.kind === 'audio')
    .filter((item) => !normalized || item.title.toLowerCase().includes(normalized))
    .map((item) => ({
      id: item.id,
      uri: item.uri,
      name: item.title || 'Untitled audio',
      durationMs: item.durationMs ?? 0,
      mimeType: item.mimeType,
      source: 'library' as const,
    }));
  return { permissionGranted: result.permissionGranted, audio };
}
