import type { Plugin } from '@elizaos/core';

export const nexusMusicPlugin: Plugin = {
  name: 'nexus-music',
  description: 'Nexus Assistant music control adapter backed by Android music intents.',
  actions: [
    {
      name: 'PLAY_MUSIC',
      similes: ['PLAY_SONG', 'START_MUSIC', 'MUSIC_SEARCH'],
      description: 'Find and play a requested song through a user-selected compatible music app.',
      validate: async () => true,
      handler: async (_runtime, message, _state, _options, callback) => {
        callback?.({
          text: message.content.text
            ? 'Nexus Music action: play ' + message.content.text
            : 'Nexus Music action: play the requested song.',
        });
        return true;
      },
      examples: [
        [
          { name: 'user', content: { text: 'play Kesariya' } },
          { name: 'assistant', content: { text: 'I will play Kesariya through the selected music app.' } },
        ],
      ],
    },
  ],
};
