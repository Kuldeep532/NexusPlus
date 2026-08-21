export type SimpleRootScreen = 'home' | 'profile' | 'settings';

export type HomeFeatureGroup = {
  id: string;
  title: string;
  description?: string;
  routes: string[];
};

export const HOME_FEATURE_GROUPS: HomeFeatureGroup[] = [
  {
    id: 'reader',
    title: 'Book & Document Reader',
    description: 'Read supported books and documents.',
    routes: ['reader', 'library'],
  },
  {
    id: 'pdf',
    title: 'PDF Tools',
    description: 'PDF conversion, protection, merge and other tools.',
    routes: ['pdf', 'pdf-protect'],
  },
  {
    id: 'security',
    title: 'Security',
    description: 'Biometric Vault and File Encryption.',
    routes: ['vault', 'file-encryption'],
  },
  {
    id: 'media',
    title: 'Media Tools',
    description: 'Media Player, Radio, Video Editor and Vocal Remover.',
    routes: ['media', 'radio', 'video-editor', 'vocal-remover'],
  },
  {
    id: 'utilities',
    title: 'Utility Tools',
    description: 'Clock, alarms, stopwatch, time and device utilities.',
    routes: ['clock', 'time-announcer', 'battery-announcer'],
  },
  {
    id: 'camera',
    title: 'Camera & Selfie',
    description: 'Camera and selfie tools.',
    routes: ['selfie'],
  },
];

export const SIMPLE_ROOT_SCREENS: SimpleRootScreen[] = [
  'home',
  'profile',
  'settings',
];

export type SettingsRoute =
  | 'app-preferences'
  | 'notifications'
  | 'permissions'
  | 'security'
  | 'appearance'
  | 'language'
  | 'reader-settings'
  | 'media-settings'
  | 'privacy-policy'
  | 'about-us';

export const SETTINGS_ROUTES: SettingsRoute[] = [
  'app-preferences',
  'notifications',
  'permissions',
  'security',
  'appearance',
  'language',
  'reader-settings',
  'media-settings',
  'privacy-policy',
  'about-us',
];

export type ProfileState = {
  displayName: string;
  email?: string;
  avatarUri?: string;
  signedIn: boolean;
};

export const DEFAULT_PROFILE_STATE: ProfileState = {
  displayName: 'Sign in',
  signedIn: false,
};
