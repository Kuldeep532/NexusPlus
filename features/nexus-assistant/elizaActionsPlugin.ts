import type { Plugin } from '@elizaos/core';
import { getAssistantCapabilities, type AssistantCapability } from './agentCapabilities';
import { getNexusElizaActions } from './elizaAgentPlugin';

function actionName(capability: AssistantCapability): string {
  return 'NEXUS_' + capability.id.replace(/-/g, '_').toUpperCase();
}

function examplesFor(capability: AssistantCapability): Array<Array<{ name: string; content: { text: string } }>> {
  const known = getNexusElizaActions().find(
    (item) => item.id.replace(/_/g, '-').toLowerCase() === capability.id.toLowerCase(),
  );
  if (!known?.examples.length) return [];
  return [[
    { name: 'user', content: { text: known.examples[0] } },
    { name: 'assistant', content: { text: capability.title + ' will be routed through the Nexus capability executor.' } },
  ]];
}

export const nexusCapabilityPlugin: Plugin = {
  name: 'nexus-capabilities',
  description: 'ElizaOS action catalog for Nexus Assistant. Execution remains in the Android-safe Nexus capability executor.',
  actions: getAssistantCapabilities().map((capability) => ({
    name: actionName(capability),
    similes: [capability.id.toUpperCase(), capability.title.toUpperCase()],
    description: capability.description,
    validate: async () => true,
    handler: async (_runtime, message, _state, _options, callback) => {
      callback?.({
        text: message.content.text
          ? capability.title + ': ' + message.content.text
          : capability.title + ' requested.',
      });
      return true;
    },
    examples: examplesFor(capability),
  })),
};
