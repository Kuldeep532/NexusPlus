import type { AudioEditorSource } from './types';

export type AudioToVideoImage = {
  id: string;
  uri: string;
  name: string;
  durationMs: number;
};

export type AudioToVideoProject = {
  audio: AudioEditorSource | null;
  images: AudioToVideoImage[];
};

export function getImageTimelineDuration(images: AudioToVideoImage[]): number {
  return images.reduce((total, image) => total + Math.max(0, image.durationMs), 0);
}

export function getRemainingAudioTime(audioDurationMs: number, images: AudioToVideoImage[]): number {
  return Math.max(0, audioDurationMs - getImageTimelineDuration(images));
}

export function canAddImage(audioDurationMs: number, images: AudioToVideoImage[]): boolean {
  return audioDurationMs > 0 && getImageTimelineDuration(images) < audioDurationMs;
}

export function clampImageDuration(durationMs: number, audioDurationMs: number, images: AudioToVideoImage[], index: number): number {
  const otherDuration = images.reduce((total, image, imageIndex) => imageIndex === index ? total : total + Math.max(0, image.durationMs), 0);
  return Math.max(1000, Math.min(Math.round(durationMs), Math.max(1000, audioDurationMs - otherDuration)));
}
