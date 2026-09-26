import { nexusCapabilityPlugin } from './elizaActionsPlugin';
import { nexusElizaAgentPlugin } from './elizaAgentPlugin';

export function getNexusElizaPlugins() {
  return [nexusCapabilityPlugin, nexusElizaAgentPlugin] as const;
}
