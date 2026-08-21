import type { AppRouteId, AppRootTab } from './appShellTypes';

export type NavigationTarget = {
  route: AppRouteId;
  params?: Record<string, string | number | boolean | undefined>;
};

export const ROOT_TABS: readonly AppRootTab[] = ['home', 'reader', 'tools', 'profile'];

export const ROOT_TAB_ROUTES: Record<AppRootTab, AppRouteId> = {
  home: 'home',
  reader: 'reader',
  tools: 'tools',
  profile: 'profile',
};

export function isRootTab(route: AppRouteId): route is AppRootTab {
  return ROOT_TABS.includes(route as AppRootTab);
}

export function routeForDocument(documentId?: string): NavigationTarget {
  return {
    route: 'reader',
    params: documentId ? { documentId } : undefined,
  };
}

export function routeForSettings(): NavigationTarget {
  return { route: 'settings' };
}

export function routeForProfile(): NavigationTarget {
  return { route: 'profile' };
}
