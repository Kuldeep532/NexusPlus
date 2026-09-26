import { nexusMusicPlugin } from './elizaMusicPlugin';
import { nexusCapabilityPlugin } from './elizaActionsPlugin';

/**
 * ElizaOS is used as the assistant's lightweight action/agent semantic layer.
 * Actual device work stays behind Nexus's registered Android-safe capabilities.
 * Conversational chat is handled separately by the existing Gemini/Gateway flow.
 */
export function getNexusElizaPlugins() {
  return [nexusCapabilityPlugin, nexusMusicPlugin] as const;
}
