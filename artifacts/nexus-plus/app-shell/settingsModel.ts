export type SettingsSection =
  | 'appearance'
  | 'reader'
  | 'audio'
  | 'notifications'
  | 'privacy'
  | 'permissions'
  | 'storage'
  | 'about';

export type SettingsItem = {
  id: string;
  title: string;
  description?: string;
  section: SettingsSection;
  nativeAction?: 'open-notification-settings' | 'open-battery-settings' | 'open-biometric-settings' | 'open-alarm-settings' | 'none';
};

export const SETTINGS_ITEMS: readonly SettingsItem[] = [
  { id: 'theme', title: 'Appearance', section: 'appearance' },
  { id: 'reader-font', title: 'Reader Font & Text Size', section: 'reader' },
  { id: 'reader-spacing', title: 'Reader Spacing & Layout', section: 'reader' },
  { id: 'audio', title: 'Audio & Playback', section: 'audio' },
  { id: 'notifications', title: 'Notifications', section: 'notifications', nativeAction: 'open-notification-settings' },
  { id: 'biometric', title: 'Biometric Security', section: 'privacy', nativeAction: 'open-biometric-settings' },
  { id: 'vault', title: 'Secure Vault', section: 'privacy' },
  { id: 'permissions', title: 'App Permissions', section: 'permissions' },
  { id: 'battery', title: 'Background & Battery', section: 'permissions', nativeAction: 'open-battery-settings' },
  { id: 'alarm', title: 'Alarm Permissions', section: 'permissions', nativeAction: 'open-alarm-settings' },
  { id: 'storage', title: 'Storage & Downloads', section: 'storage' },
  { id: 'about', title: 'About Nexus Plus', section: 'about' },
] as const;
