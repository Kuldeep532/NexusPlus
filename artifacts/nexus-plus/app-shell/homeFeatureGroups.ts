export type HomeFeatureCard = {
  id: 'book-reader' | 'biometric-vault' | 'pdf-tools' | 'utility-tools' | 'media-player' | 'video-editor';
  title: string;
  subtitle: string;
  route: string;
};

export const HOME_FEATURE_CARDS: HomeFeatureCard[] = [
  {
    id: 'book-reader',
    title: 'Book & Document Reader',
    subtitle: 'PDF, EPUB and more',
    route: '/reader',
  },
  {
    id: 'biometric-vault',
    title: 'Biometric Vault',
    subtitle: 'Passwords, notes and cards',
    route: '/vault',
  },
  {
    id: 'pdf-tools',
    title: 'PDF Tools',
    subtitle: 'Create, protect and manage PDFs',
    route: '/pdf-tools',
  },
  {
    id: 'utility-tools',
    title: 'Utility Tools',
    subtitle: 'Clock and useful device tools',
    route: '/utility-tools',
  },
  {
    id: 'media-player',
    title: 'Media Player',
    subtitle: 'Music, radio and media',
    route: '/media',
  },
  {
    id: 'video-editor',
    title: 'Video Editor',
    subtitle: 'Edit and export videos',
    route: '/video-editor',
  },
];

export const HOME_GROUP_ROUTES = {
  'pdf-tools': [
    'pdf-native',
    'protect-pdf',
    'pdf-to-image',
    'merge-pdf',
    'compress-pdf',
  ],
  'utility-tools': [
    'clock',
    'alarm',
    'stopwatch',
    'world-clock',
    'battery-announcer',
    'time-announcer',
  ],
  media: [
    'media-player',
    'online-radio',
    'voice-library',
    'vocal-remover',
  ],
} as const;
