import type { Action, Plugin } from '@elizaos/core';

export type NexusElizaActionId =
  | 'PLAY_MUSIC'
  | 'PAUSE_MUSIC'
  | 'RESUME_MUSIC'
  | 'NEXT_MUSIC'
  | 'PREVIOUS_MUSIC'
  | 'STOP_MUSIC'
  | 'CREATE_REMINDER'
  | 'SET_ALARM'
  | 'CREATE_CALENDAR_EVENT'
  | 'OPEN_URL'
  | 'OPEN_APP'
  | 'OPEN_TOOL'
  | 'GENERATE_QR';

export type NexusElizaAction = {
  id: NexusElizaActionId;
  name: string;
  similes: string[];
  description: string;
  examples: string[];
};

const actions: NexusElizaAction[] = [
  { id: 'PLAY_MUSIC', name: 'Play music', similes: ['PLAY_SONG', 'START_MUSIC', 'MUSIC_SEARCH', 'चलाओ', 'गाना बजाओ'], description: 'Play a requested song through the selected compatible Android music app.', examples: ['play Kesariya', 'play music'] },
  { id: 'PAUSE_MUSIC', name: 'Pause music', similes: ['PAUSE_SONG', 'PAUSE_MUSIC', 'पॉज म्यूजिक'], description: 'Pause current media playback.', examples: ['pause the music'] },
  { id: 'RESUME_MUSIC', name: 'Resume music', similes: ['RESUME_SONG', 'CONTINUE_MUSIC', 'जारी करो'], description: 'Resume current media playback.', examples: ['resume music'] },
  { id: 'NEXT_MUSIC', name: 'Next track', similes: ['NEXT_SONG', 'SKIP_TRACK', 'अगला गाना'], description: 'Skip to the next media track.', examples: ['next song'] },
  { id: 'PREVIOUS_MUSIC', name: 'Previous track', similes: ['PREVIOUS_SONG', 'BACK_TRACK', 'पिछला गाना'], description: 'Return to the previous media track.', examples: ['previous song'] },
  { id: 'STOP_MUSIC', name: 'Stop music', similes: ['STOP_SONG', 'STOP_PLAYBACK', 'म्यूजिक बंद'], description: 'Stop current media playback.', examples: ['stop the music'] },
  { id: 'CREATE_REMINDER', name: 'Create reminder', similes: ['REMIND_ME', 'REMEMBER_THIS', 'याद दिलाओ'], description: 'Create a local Nexus reminder from natural language.', examples: ['remind me at 5 pm for coffee', 'in 20 minutes remind me to call mom'] },
  { id: 'SET_ALARM', name: 'Set alarm', similes: ['WAKE_ME', 'ALARM', 'अलार्म लगाओ'], description: 'Schedule an Android alarm at the requested time.', examples: ['set an alarm for 6 am'] },
  { id: 'CREATE_CALENDAR_EVENT', name: 'Create calendar event', similes: ['ADD_EVENT', 'MEETING', 'APPOINTMENT', 'मीटिंग'], description: 'Prepare an Android calendar event from natural language.', examples: ['create a meeting tomorrow at 10'] },
  { id: 'OPEN_URL', name: 'Open URL', similes: ['OPEN_LINK', 'BROWSE_URL', 'लिंक खोलो'], description: 'Open a user-requested HTTP(S) URL.', examples: ['open https://example.com'] },
  { id: 'OPEN_APP', name: 'Open app', similes: ['LAUNCH_APP', 'START_APP', 'ऐप खोलो'], description: 'Open an installed app through an explicitly registered Android deep link or intent.', examples: ['open YouTube'] },
  { id: 'OPEN_TOOL', name: 'Open Nexus tool', similes: ['OPEN_FEATURE', 'OPEN_NEXUS_TOOL', 'टूल खोलो'], description: 'Open a registered Nexus Plus tool from the feature catalog.', examples: ['open PDF compressor'] },
  { id: 'GENERATE_QR', name: 'Generate QR', similes: ['MAKE_QR', 'QR_CODE', 'क्यूआर बनाओ'], description: 'Open the existing Nexus QR generator for the requested payload.', examples: ['make a QR code'] },
];

const pluginActions: Action[] = actions.map((action) => ({
  name: action.id,
  similes: action.similes,
  description: action.description,
  validate: async () => true,
  handler: async (_runtime, message, _state, _options, callback) => {
    callback?.({ text: action.name + (message.content.text ? ': ' + message.content.text : '') });
    return true;
  },
  examples: action.examples.map((text) => [
    { name: 'user', content: { text } },
    { name: 'assistant', content: { text: 'Nexus Assistant will route this request through its registered capability executor.' } },
  ]),
}));

export const nexusElizaAgentPlugin: Plugin = {
  name: 'nexus-agent',
  description: 'ElizaOS action semantics for Android-safe Nexus Assistant capabilities.',
  actions: pluginActions,
};

export function getNexusElizaActions(): readonly NexusElizaAction[] {
  return actions;
}

export function findNexusElizaAction(text: string): NexusElizaAction | null {
  const value = text.trim().toLowerCase();
  if (!value) return null;
  return actions.find((action) => {
    if (action.similes.some((simile) => value.includes(simile.toLowerCase()))) return true;
    return action.examples.some((example) => value.includes(example.toLowerCase()));
  }) ?? null;
}
