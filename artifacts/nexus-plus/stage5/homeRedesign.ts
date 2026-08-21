export type HomePrimaryFeature = {
  id:
  | 'book-reader'
  | 'biometric-vault'
  | 'pdf-tools'
  | 'utility-tools'
  | 'media-player'
  | 'video-editor';
  title: string;
  subtitle: string;
};

export const HOME_PRIMARY_FEATURES: HomePrimaryFeature[] = [
  {
    id: 'book-reader',
    title: 'Book & Document Reader',
    subtitle: 'Read PDF, EPUB and supported documents',
  },
  {
    id: 'biometric-vault',
    title: 'Biometric Vault',
    subtitle: 'Protect private passwords, cards, notes and files',
  },
  {
    id: 'pdf-tools',
    title: 'PDF Tools',
    subtitle: 'Open the complete PDF toolkit',
  },
  {
    id: 'utility-tools',
    title: 'Utility Tools',
    subtitle: 'Clock, alarm, battery, time and other utilities',
  },
  {
    id: 'media-player',
    title: 'Nexus Media Player',
    subtitle: 'Audio, video and online radio in one player',
  },
  {
    id: 'video-editor',
    title: 'Video Editor',
    subtitle: 'Edit, trim, convert and manage videos',
  },
];

export const HOME_LAYOUT = {
  showOnlyPrimaryFeatures: true,
  showProfileInHeader: true,
  showSettingsAction: true,
  bottomTabs: ['Home', 'Profile', 'Settings'] as const,
};
