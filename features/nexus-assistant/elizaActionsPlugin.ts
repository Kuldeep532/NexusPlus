import type { Plugin } from '@elizaos/core';
import { getAssistantCapabilities, type AssistantCapability } from './agentCapabilities';

function actionName(capability: AssistantCapability): string {
  return 'NEXUS_' + capability.id.replace(/-/g, '_').toUpperCase();
}

function examplesFor(capability: AssistantCapability): Array<Array<{ name: string; content: { text: string } }>> {
  switch (capability.id) {
    case 'create-reminder':
      return [[
        { name: 'user', content: { text: 'remind me at 5 PM for coffee' } },
        { name: 'assistant', content: { text: 'Create a local reminder for coffee at 5 PM.' } },
      ]];
    case 'set-alarm':
      return [[
        { name: 'user', content: { text: 'wake me at 6:30 AM' } },
        { name: 'assistant', content: { text: 'Set an alarm for 6:30 AM.' } },
      ]];
    case 'play-media':
      return [[
        { name: 'user', content: { text: 'play Kesariya' } },
        { name: 'assistant', content: { text: 'Play the requested song.' } },
      ]];
    case 'calendar-event':
      return [[
        { name: 'user', content: { text: 'schedule a meeting tomorrow at 10 AM' } },
        { name: 'assistant', content: { text: 'Prepare the calendar event details.' } },
      ]];
    default:
      return [];
  }
}

export const nexusCapabilityPlugin: Plugin = {
  name: 'nexus-capabilities',
  description: 'ElizaOS action catalog for Nexus Assistant. Execution remains in the Android-safe Nexus capability executor.',
  actions: getAssistantCapabilities().map((capability) => ({
    name: actionName(capability),
    similes: [
      capability.id.toUpperCase(),
      capability.title.toUpperCase(),
    ],
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
