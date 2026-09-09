import { registerFeature } from './featureRegistry';

registerFeature({
  id: 'pc-remote-control',
  title: 'PC Remote Control',
  description: 'Control an authorized Windows or Ubuntu PC over the local network.',
  route: '/pc-remote',
  icon: 'monitor',
  category: 'utility',
  featured: true,
  order: 76,
});
