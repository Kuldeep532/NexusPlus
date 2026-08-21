import type { LocalMediaAi, MediaItemModel } from './types';

/**
 * Local-only AI boundary.
 *
 * The player never sends media to a remote AI service. Wire these methods to an
 * on-device model runtime available in your Expo development build, such as a
 * native ONNX Runtime / TensorFlow Lite integration. Keeping the interface here
 * lets the UI remain independent from whichever local model is shipped later.
 */
export class NexusLocalMediaAI implements LocalMediaAi {
  constructor(
    private readonly runtime: {
      transcribeAudio?: (uri: string) => Promise<string>;
      summarizeText?: (text: string) => Promise<string>;
      chapterText?: (text: string) => Promise<Array<{ title: string; startMs: number }>>;
      classifyMedia?: (metadata: Pick<MediaItemModel, 'title' | 'artist' | 'album'>) => Promise<string[]>;
    } = {},
  ) {}

  async transcribe(uri: string) {
    if (!this.runtime.transcribeAudio) return '';
    return this.runtime.transcribeAudio(uri);
  }

  async summarize(text: string) {
    if (!this.runtime.summarizeText) return text.slice(0, 500);
    return this.runtime.summarizeText(text);
  }

  async extractChapters(text: string) {
    if (!this.runtime.chapterText) return [];
    return this.runtime.chapterText(text);
  }

  async suggestTags(metadata: Pick<MediaItemModel, 'title' | 'artist' | 'album'>) {
    if (!this.runtime.classifyMedia) return [];
    return this.runtime.classifyMedia(metadata);
  }
}
