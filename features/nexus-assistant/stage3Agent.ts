import { addMessage } from './assistantStore';
import { executeCapability, type ExecutionResult } from './agentExecutor';
import { formatCapabilityConfirmation, planCapability, type CapabilityProposal } from './agentPlanner';

export type Stage3AgentInput = {
  sessionId: string;
  userText: string;
  confirmed?: boolean;
  proposal?: CapabilityProposal;
  onStatus?: (message: string) => void;
  onProposal?: (message: string) => void;
};

export async function runStage3Agent(input: Stage3AgentInput): Promise<ExecutionResult | null> {
  const proposal = input.proposal ?? planCapability(input.userText);
  if (!proposal) {
    input.onStatus?.('No registered action matched. Local chat inference handles ordinary conversation.');
    return null;
  }

  if (proposal.requiresConfirmation && !input.confirmed) {
    const confirmation = formatCapabilityConfirmation(proposal);
    input.onProposal?.(confirmation);
    await addMessage(input.sessionId, 'assistant', confirmation);
    input.onStatus?.('Waiting for explicit confirmation before running the action.');
    return null;
  }

  input.onStatus?.(`Running ${proposal.capability.title} locally…`);
  try {
    const result = await executeCapability(proposal, { confirmed: Boolean(input.confirmed) });
    await addMessage(input.sessionId, 'assistant', result.message);
    input.onStatus?.(result.success ? 'Action completed locally.' : result.message);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Action failed.';
    await addMessage(input.sessionId, 'assistant', message);
    input.onStatus?.(message);
    throw error;
  }
}
