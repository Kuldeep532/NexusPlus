import { router } from 'expo-router';
import { getHomeFeatures, type HomeFeatureDefinition } from '@/features/app-shell/featureRegistry';

export type AssistantToolKind = 'file' | 'qr' | 'route';

export type AssistantToolDefinition = {
  id: string;
  title: string;
  description: string;
  kind: AssistantToolKind;
  route?: string;
  category: string;
};

const SPECIAL_TOOLS: AssistantToolDefinition[] = [
  { id: 'file', title: 'File', description: 'Attach a local file for Nexus Assistant to inspect or use with a supported tool.', kind: 'file', category: 'files' },
  { id: 'qr-code', title: 'Generate QR Code', description: 'Generate Text, URL, WhatsApp, Wi-Fi, UPI and other supported QR payloads.', kind: 'qr', route: '/utilities/qr-generator', category: 'utility' },
];

function registryTool(feature: HomeFeatureDefinition): AssistantToolDefinition {
  return {
    id: feature.id,
    title: feature.title,
    description: feature.description,
    kind: 'route',
    route: feature.route,
    category: feature.category,
  };
}

export function getAssistantToolCatalog(): AssistantToolDefinition[] {
  const byId = new Map<string, AssistantToolDefinition>();
  for (const tool of SPECIAL_TOOLS) byId.set(tool.id, tool);
  for (const feature of getHomeFeatures()) {
    if (!byId.has(feature.id)) byId.set(feature.id, registryTool(feature));
  }
  return [...byId.values()];
}

export function searchAssistantTools(query: string): AssistantToolDefinition[] {
  const q = query.trim().toLowerCase();
  if (!q) return getAssistantToolCatalog();
  return getAssistantToolCatalog().filter((tool) =>
    (tool.title + ' ' + tool.description + ' ' + tool.category).toLowerCase().includes(q),
  );
}

export function openAssistantTool(tool: AssistantToolDefinition): boolean {
  if (!tool.route) return false;
  router.push(tool.route as never);
  return true;
}
