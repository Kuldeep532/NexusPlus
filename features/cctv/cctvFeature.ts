import type { HomeFeatureDefinition } from '@/features/app-shell/featureRegistry';

export const CCTV_FEATURE: HomeFeatureDefinition = {
  id: 'cctv-cameras',
  title: 'CCTV Cameras',
  description: 'Manage authorized CCTV cameras over a secure local connection.',
  route: '/cctv-cameras',
  icon: 'video',
  category: 'security',
  featured: true,
  order: 77,
};

export const CCTV_ROUTES = {
  list: '/cctv-cameras',
  add: '/cctv-cameras/add',
  live: '/cctv-cameras/live',
  recordings: '/cctv-cameras/recordings',
  playback: '/cctv-cameras/playback',
} as const;
