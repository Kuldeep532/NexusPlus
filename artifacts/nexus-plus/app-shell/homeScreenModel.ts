import { HOME_FEATURE_GROUPS } from './simpleAppShell';

export const HOME_SCREEN_TITLE = 'Nexus Plus';
export const HOME_SCREEN_SUBTITLE = 'All tools in one place';

export const HOME_SCREEN_FEATURES = HOME_FEATURE_GROUPS;

export function getHomeFeatureRoute(featureId: string): string | null {
  const feature = HOME_SCREEN_FEATURES.find((item) => item.id === featureId);
  return feature?.routes[0] ?? null;
}
