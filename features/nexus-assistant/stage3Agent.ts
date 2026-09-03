import { addMessage } from './assistantStore';
import { executeCapability } from './agentExecutor';
import { formatCapabilityConfirmation, planCapability } from './agentPlanner';

export type Stage3AgentInput = {
  sessionId: string;
  userText: string;
  confirmed?: boolean;
  onStatus?: (message: string) => void;
  onProposal?: (message: string) => void;
};

export async function runStage3Agent(input: Stage3AgentInput): Promise<void> {
  const proposal = planCapability(input.userText);
  if (!proposal) {
    input.onStatus?.('No registered action matched. Local chat inference handles ordinary conversation.');
    return;
  }

  if (proposal.requiresConfirmation && !input.confirmed) {
    const confirmation = formatCapabilityConfirmation(proposal);
    input.onProposal?.(confirmation);
    await addMessage(input.sessionId, 'assistant', confirmation);
    input.onStatus?.('Waiting for explicit confirmation before running the action.');
    return;
  }

  input.onStatus?.(`Running ${proposal.capability.title} locally…`);
  const result = await executeCapability(proposal, { confirmed: Boolean(input.confirmed) });
  await addMessage(input.sessionId, 'assistant', result.message);
  input.onStatus?.(result.success ? 'Action completed locally.' : 'Action is registered but its native executor is not implemented yet.');
}
