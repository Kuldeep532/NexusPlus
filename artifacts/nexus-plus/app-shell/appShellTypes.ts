export type AppRouteId =
  | 'home'
  | 'reader'
  | 'library'
  | 'tools'
  | 'clock'
  | 'vault'
  | 'pdf'
  | 'media'
  | 'radio'
  | 'video-editor'
  | 'vocal-remover'
  | 'selfie'
  | 'profile'
  | 'settings';

export type AppRootTab = 'home' | 'reader' | 'tools' | 'profile';

export type AppShellConfig = {
  initialRoute: AppRouteId;
  primaryFeature: AppRootTab;
  enableSystemBackHandling: boolean;
  enableDeepLinks: boolean;
  enableStateRestore: boolean;
};

export const DEFAULT_APP_SHELL_CONFIG: AppShellConfig = {
  initialRoute: 'home',
  primaryFeature: 'reader',
  enableSystemBackHandling: true,
  enableDeepLinks: true,
  enableStateRestore: true,
};
