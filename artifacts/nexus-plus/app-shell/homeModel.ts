import type { DocumentRecord } from '../document-reader/documentTypes';
import type { AppRouteId } from './appShellTypes';

type QuickAction = {
  id: string;
  title: string;
  route: AppRouteId;
  enabled: boolean;
};

export type HomeModel = {
  greeting: string;
  continueReading: DocumentRecord | null;
  recentDocuments: DocumentRecord[];
  quickActions: QuickAction[];
};

export const HOME_QUICK_ACTIONS: readonly QuickAction[] = [
  { id: 'open-document', title: 'Open Document', route: 'reader', enabled: true },
  { id: 'library', title: 'Library', route: 'library', enabled: true },
  { id: 'clock', title: 'Clock & Alarm', route: 'clock', enabled: true },
  { id: 'vault', title: 'Secure Vault', route: 'vault', enabled: true },
  { id: 'pdf', title: 'PDF Tools', route: 'pdf', enabled: true },
  { id: 'media', title: 'Media Player', route: 'media', enabled: true },
  { id: 'tools', title: 'More Tools', route: 'tools', enabled: true },
] as const;

export function buildHomeModel(
  recentDocuments: DocumentRecord[],
  greeting = 'Welcome to Nexus Plus',
): HomeModel {
  return {
    greeting,
    continueReading: recentDocuments[0] ?? null,
    recentDocuments: recentDocuments.slice(0, 8),
    quickActions: [...HOME_QUICK_ACTIONS],
  };
}
