export type VideoDescriptionLanguage = 'hi' | 'en';

export type VideoDescription = {
  timestampMs: number;
  text: string;
  language: VideoDescriptionLanguage;
  confidence?: number;
};

export interface VideoDescriptionAnalyzer {
  isAvailable(): Promise<boolean>;
  describeFrame(uri: string, timestampMs: number, language: VideoDescriptionLanguage): Promise<VideoDescription | null>;
}

/**
 * Native Android adapter boundary. The JS player never assumes OpenCV exists;
 * a native OpenCV implementation can be registered behind this interface.
 */
class UnavailableVideoDescriptionAnalyzer implements VideoDescriptionAnalyzer {
  async isAvailable(): Promise<boolean> { return false; }
  async describeFrame(): Promise<VideoDescription | null> { return null; }
}

export const videoDescriptionAnalyzer: VideoDescriptionAnalyzer = new UnavailableVideoDescriptionAnalyzer();
