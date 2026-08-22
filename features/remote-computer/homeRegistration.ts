import type { RemoteComputerCapability } from '@/src/remote-computer/remoteComputerTypes';

/** Home-screen registration metadata for the Remote Computer feature. */
export const remoteComputerHomeFeature = {
  id: 'remote-computer',
  title: 'Computer Control',
  subtitle: 'Securely control your Windows, Ubuntu, or macOS computer from your phone.',
  icon: 'remote-desktop',
  route: '/remote-computer',
  accessibilityLabel: 'Computer Control',
  capabilities: ['keyboard', 'pointer', 'clipboard', 'audio', 'voice-command', 'screen-reader', 'unlock'] as RemoteComputerCapability[],
  orderGroup: 'tools',
  priority: 40,
  contentFeatureId: 'home',
  contentKey: 'remote-computer',
} as const;
