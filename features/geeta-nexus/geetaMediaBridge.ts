import type { MediaItemModel } from '@/media-player/types';
import type { GitaAudioChapter } from './geetaTypes';

export function geetaChapterToMediaItem(chapter: GitaAudioChapter): MediaItemModel {
  return { id: `geeta:${chapter.id}`, uri: chapter.uri, kind: 'audio', source: 'local', title: `Chapter ${chapter.chapterNumber}: ${chapter.title}`, artist: 'Bhagavad Gita', album: 'Gita Nexus', artworkUri: chapter.artworkUri, isLocal: true, mimeType: chapter.mimeType ?? 'audio/mpeg' };
}
export function geetaChaptersToQueue(chapters: GitaAudioChapter[]): MediaItemModel[] { return chapters.map(geetaChapterToMediaItem); }
