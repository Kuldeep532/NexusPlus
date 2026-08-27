export type FeatureCategory = 'utility' | 'pdf' | 'media' | 'security' | 'productivity';
export interface HomeFeatureDefinition { id: string; title: string; description: string; route: string; icon: string; category: FeatureCategory; featured?: boolean; order?: number; }
const registry: HomeFeatureDefinition[] = [
  { id: 'book-reader', title: 'Book Reader', description: 'Read books and documents.', route: '/reader', icon: 'book-open', category: 'productivity', featured: true, order: 10 },
  { id: 'media-player', title: 'Media Player', description: 'Play audio and media.', route: '/media-player', icon: 'play-circle', category: 'media', featured: true, order: 20 },
  { id: 'biometric-vault', title: 'Biometric Vault', description: 'Protect sensitive information.', route: '/biometric-vault', icon: 'shield', category: 'security', featured: true, order: 30 },
  { id: 'computer-control', title: 'Computer Control', description: 'Control your computer remotely.', route: '/remote-computer', icon: 'monitor', category: 'productivity', featured: true, order: 40 },
  { id: 'payment-announcer', title: 'Payment Announcer', description: 'Secure payment announcements.', route: '/payment-announcer', icon: 'volume-2', category: 'security', featured: true, order: 50 },
  { id: 'expense-tracker', title: 'Finance Tracker', description: 'Track and review expenses securely.', route: '/expense-tracker', icon: 'credit-card', category: 'security', featured: true, order: 60 },
  { id: 'video-editor', title: 'Video Editor', description: 'Edit and export videos.', route: '/video-editor', icon: 'video', category: 'media', featured: true, order: 70 },
  { id: 'file-manager', title: 'File Manager', description: 'Browse, organize, preview and secure local files.', route: '/file-manager', icon: 'folder', category: 'utility', featured: true, order: 75 },
  { id: 'time-announcer', title: 'Time Announcer', description: 'Configure time announcements.', route: '/time-announcer', icon: 'volume-2', category: 'utility' },
  { id: 'reminders', title: 'My Reminders', description: 'Create accessible voice reminders.', route: '/reminders', icon: 'bell', category: 'utility', featured: true, order: 78 },
  { id: 'clock', title: 'Clock', description: 'Announce and work with the current time.', route: '/time-announcer', icon: 'clock', category: 'utility' },
  { id: 'battery-announcer', title: 'Battery Announcer', description: 'Announce battery state.', route: '/battery-announcer', icon: 'battery', category: 'utility' },
  { id: 'pdf-tools', title: 'PDF Tools', description: 'Convert, protect, lock, unlock and manage PDFs.', route: '/categories/pdf-tools', icon: 'file-text', category: 'pdf' },
  { id: 'online-radio', title: 'Online Radio', description: 'Listen to online radio.', route: '/online-radio', icon: 'radio', category: 'media' },
  { id: 'nexus-ai-workflow', title: 'Nexus AI Workflow', description: 'Draft bilingual messages and plan email, meeting and calendar workflows.', route: '/productivity-ai', icon: 'zap', category: 'productivity' },
];
export function registerFeature(feature: HomeFeatureDefinition): void { const existingIndex = registry.findIndex((item) => item.id === feature.id); if (existingIndex >= 0) registry[existingIndex] = feature; else registry.push(feature); }
export function getHomeFeatures(): HomeFeatureDefinition[] { return [...registry].sort((a, b) => (a.order ?? 1000) - (b.order ?? 1000)); }
export function getFeaturedHomeFeatures(): HomeFeatureDefinition[] { return getHomeFeatures().filter((feature) => feature.featured); }
export function getCategoryTools(category: FeatureCategory): HomeFeatureDefinition[] { return getHomeFeatures().filter((feature) => feature.category === category && !feature.featured && feature.id !== 'pdf-tools'); }
export function getFeaturesByCategory(category: FeatureCategory): HomeFeatureDefinition[] { return getHomeFeatures().filter((feature) => feature.category === category && !feature.featured); }
export const FEATURE_CATEGORY_META: Record<FeatureCategory, { title: string; description: string; icon: string; route: string }> = {
  utility: { title: 'Utility Tools', description: 'Clock, time, alarm and accessibility utilities.', icon: 'clock', route: '/categories/utility-tools' },
  pdf: { title: 'PDF Tools', description: 'Convert, protect, lock, unlock and manage PDFs.', icon: 'file-text', route: '/categories/pdf-tools' },
  media: { title: 'Media Tools', description: 'Audio, radio and video tools.', icon: 'film', route: '/categories/media-tools' },
  security: { title: 'Security Tools', description: 'Additional security and privacy utilities. File encryption lives in File Manager.', icon: 'shield', route: '/categories/security-tools' },
  productivity: { title: 'Productivity Tools', description: 'Additional focused workflows and tools.', icon: 'grid', route: '/categories/productivity-tools' },
};
