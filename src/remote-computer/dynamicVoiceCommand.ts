export type DynamicVoiceCommand = {
  commandId: string;
  transcript: string;
  source: 'voice';
  computerId: string;
  requestedAt: number;
};

export function createDynamicVoiceCommand(computerId: string, transcript: string): DynamicVoiceCommand {
  const value = transcript.trim();
  if (!value) throw new Error('Voice command cannot be empty.');
  return {
    commandId: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    transcript: value,
    source: 'voice',
    computerId,
    requestedAt: Date.now(),
  };
}

/**
 * Android deliberately does not encode Zoom, WhatsApp, YouTube, or other
 * application commands. The desktop agent owns intent parsing and routes the
 * request to an authorized application adapter.
 */
export function toVoiceTransportMessage(command: DynamicVoiceCommand) {
  return {
    type: 'voice_transcript',
    computerId: command.computerId,
    commandId: command.commandId,
    transcript: command.transcript,
    source: command.source,
    requestedAt: command.requestedAt,
  };
}
