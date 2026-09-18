export const COMING_SOON_TV_FEATURES = [
  'TV screen mirroring',
  'Reading the TV cursor/accessibility tree directly',
  'Automatic installed-app enumeration from a Nexus TV receiver',
  'Receiver-based app launch on arbitrary TV platforms',
];

export const COMING_SOON_PC_FEATURES = [
  'Native Nexus PC receiver/desktop-agent installer',
  'Live PC screen streaming',
  'Phone screen sharing to PC',
];

export function getComingSoonLabel(feature: string): string {
  return feature + ' — Coming Soon';
}
