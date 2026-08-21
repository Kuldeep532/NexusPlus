export type FinalRootRoute = 'welcome' | 'auth' | 'home' | 'profile' | 'settings';

export type PrimaryHomeFeature =
  | 'book-reader'
  | 'biometric-vault'
  | 'pdf-tools'
  | 'utility-tools'
  | 'media-player'
  | 'video-editor';

export type SettingsRoute =
  | 'app-settings'
  | 'reader-settings'
  | 'security-settings'
  | 'media-settings'
  | 'notifications'
  | 'privacy-policy'
  | 'terms-and-conditions'
  | 'about-us';

export const PRIMARY_HOME_FEATURES: PrimaryHomeFeature[] = [
  'book-reader',
  'biometric-vault',
  'pdf-tools',
  'utility-tools',
  'media-player',
  'video-editor',
];

export const FINAL_ROOT_ROUTES: FinalRootRoute[] = [
  'welcome',
  'auth',
  'home',
  'profile',
  'settings',
];

export const FINAL_SETTINGS_ROUTES: SettingsRoute[] = [
  'app-settings',
  'reader-settings',
  'security-settings',
  'media-settings',
  'notifications',
  'privacy-policy',
  'terms-and-conditions',
  'about-us',
];

export const FINAL_APP_STRUCTURE = {
  welcome: {
    requiresPolicyAcceptance: true,
    nextRoute: 'auth' as const,
  },
  auth: {
    providers: ['google', 'email-password', 'create-account'] as const,
    nextRoute: 'home' as const,
  },
  home: {
    showProfileButton: true,
    showSettingsButton: true,
    bottomTabs: ['home', 'profile', 'settings'] as const,
    features: PRIMARY_HOME_FEATURES,
  },
  profile: {
    purpose: 'account-profile' as const,
  },
  settings: {
    includes: FINAL_SETTINGS_ROUTES,
  },
};
