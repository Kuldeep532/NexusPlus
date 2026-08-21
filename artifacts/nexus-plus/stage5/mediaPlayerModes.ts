export type MediaPlayerMode = 'audio' | 'video' | 'radio';

export const MEDIA_PLAYER_MODES: Array<{
  id: MediaPlayerMode;
  title: string;
  description: string;
}> = [
  { id: 'audio', title: 'Audio Player', description: 'Play local and online audio files.' },
  { id: 'video', title: 'Video Player', description: 'Import and play video files.' },
  { id: 'radio', title: 'Online Radio', description: 'Play supported online radio streams.' },
];

export const MEDIA_PLAYER_POLICY = {
  singlePlayerSurface: true,
  videoIsAnInternalMode: true,
  radioIsAnInternalMode: true,
  voiceLibraryLivesInSettings: true,
  supportsAndroidOpenWith: true,
};
