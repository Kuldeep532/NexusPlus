export type VoiceLibrarySettings = {
  showVoiceLibraryInSettings: boolean;
  allowVoiceDownload: boolean;
  allowVoiceDelete: boolean;
  allowVoicePreview: boolean;
};

export const DEFAULT_VOICE_LIBRARY_SETTINGS: VoiceLibrarySettings = {
  showVoiceLibraryInSettings: true,
  allowVoiceDownload: true,
  allowVoiceDelete: true,
  allowVoicePreview: true,
};

export const SETTINGS_GROUPS = [
  'General',
  'Reader',
  'Security',
  'Media',
  'Voice Library',
  'Notifications',
  'Permissions',
  'Appearance',
  'Language',
  'Privacy Policy',
  'Terms & Conditions',
  'About Us',
] as const;
