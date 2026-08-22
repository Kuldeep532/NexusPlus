export type FeatureCategory = 'utility' | 'pdf' | 'media' | 'security' | 'productivity';

export interface HomeFeatureDefinition {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: string;
  category: FeatureCategory;
  featured?: boolean;
}

const registry: HomeFeatureDefinition[] = [
  { id: 'book-reader', title: 'Book Reader', description: 'Read books and documents.', route: '/reader', icon: 'book-open', category: 'productivity', featured: true },
  { id: 'media-player', title: 'Media Player', description: 'Play audio and media.', route: '/media-player', icon: 'play-circle', category: 'media', featured: true },
  { id: 'biometric-vault', title: 'Biometric Vault', description: 'Protect sensitive information.', route: '/biometric-vault', icon: 'shield', category: 'security', featured: true },
  { id: 'computer-control', title: 'Computer Control', description: 'Control your computer remotely.', route: '/remote-computer', icon: 'monitor', category: 'productivity', featured: true },
  { id: 'payment-announcer', title: 'Payment Announcer', description: 'Secure payment announcements.', route: '/payment-announcer', icon: 'volume-2', category: 'security', featured: true },
  { id: 'expense-tracker', title: 'Finance Tracker', description: 'Track and review expenses securely.', route: '/expense-tracker', icon: 'credit-card', category: 'security', featured: true },
  { id: 'video-editor', title: 'Video Editor', description: 'Edit and export videos.', route: '/video-editor', icon: 'video', category: 'media', featured: true },
  { id: 'geeta-nexus', title: 'Geeta Nexus', description: 'Study the Bhagavad Gita, verses and audio.', route: '/geeta-nexus', icon: 'book', category: 'productivity', featured: true },
  { id: 'time-announcer', title: 'Time Announcer', description: 'Configure time announcements.', route: '/time-announcer', icon: 'volume-2', category: 'utility' },
  { id: 'clock', title: 'Clock', description: 'Announce and work with the current time.', route: '/time-announcer', icon: 'clock', category: 'utility' },
  { id: 'battery-announcer', title: 'Battery Announcer', description: 'Announce battery state.', route: '/battery-announcer', icon: 'battery', category: 'utility' },
  { id: 'pdf-tools', title: 'PDF Tools', description: 'Convert, protect and manage PDFs.', route: '/categories/pdf-tools', icon: 'file-text', category: 'pdf' },
  { id: 'online-radio', title: 'Online Radio', description: 'Listen to online radio.', route: '/online-radio', icon: 'radio', category: 'media' },
  { id: 'file-encryption', title: 'File Encryption', description: 'Protect files with encrypted containers.', route: '/file-encryption', icon: 'lock', category: 'security' },
];

export function registerFeature(feature: HomeFeatureDefinition): void {
  const existingIndex = registry.findIndex((item) => item.id === feature.id);
  if (existingIndex >= 0) registry[existingIndex] = feature;
  else registry.push(feature);
}

export function getHomeFeatures(): HomeFeatureDefinition[] {
  return [...registry];
}

export function getFeaturedHomeFeatures(): HomeFeatureDefinition[] {
  return registry.filter((feature) => feature.featured);
}

export function getFeaturesByCategory(category: FeatureCategory): HomeFeatureDefinition[] {
  return registry.filter((feature) => feature.category === category);
}

export const FEATURE_CATEGORY_META: Record<FeatureCategory, { title: string; description: string; icon: string; route: string }> = {
  utility: { title: 'Utility Tools', description: 'Clock, time and accessibility utilities.', icon: 'clock', route: '/categories/utility-tools' },
  pdf: { title: 'PDF Tools', description: 'Convert, protect and manage PDFs.', icon: 'file-text', route: '/categories/pdf-tools' },
  media: { title: 'Media Tools', description: 'Audio, radio and video tools.', icon: 'film', route: '/categories/media-tools' },
  security: { title: 'Security & Privacy', description: 'Security-sensitive tools and financial protection.', icon: 'shield', route: '/categories/security-tools' },
  productivity: { title: 'Productivity Tools', description: 'Reading, computer control and focused workflows.', icon: 'grid', route: '/categories/productivity-tools' },
};
