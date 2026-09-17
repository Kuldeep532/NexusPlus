import { addMessage } from './assistantStore';
import { executeCapability, type ExecutionResult } from './agentExecutor';
import { formatCapabilityConfirmation, planCapability, type CapabilityProposal } from './agentPlanner';
import { describeCurrentScreen } from '@/features/nexus-vision-assist/visionAssistScreen';
import { planVisionAssistIntent } from '@/features/nexus-vision-assist/visionAssistAgent';

export type Stage3AgentInput = {
  sessionId: string;
  userText: string;
  confirmed?: boolean;
  proposal?: CapabilityProposal;
  onStatus?: (message: string) => void;
  onProposal?: (message: string) => void;
};

/**
 * Shared Nexus Assistant execution entry point.
 * Vision Assist is handled before ordinary capability planning so screen
 * context becomes a real assistant response instead of a disconnected demo.
 */
export async function runStage3Agent(input: Stage3AgentInput): Promise<ExecutionResult | null> {
  const visionIntent = planVisionAssistIntent(input.userText);
  if (visionIntent?.capability.id === 'describe-screen') {
    input.onStatus?.('Reading the current screen through Android accessibility semantics…');
    try {
      const result = await describeCurrentScreen();
      await addMessage(input.sessionId, 'assistant', result.description);
      input.onStatus?.(result.available ? 'Screen context read successfully.' : 'Screen context is unavailable.');
      return {
        capabilityId: 'device-info',
        success: result.available,
        message: result.description,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to read the current screen.';
      await addMessage(input.sessionId, 'assistant', message);
      input.onStatus?.(message);
      throw error;
    }
  }

  if (visionIntent?.capability.risk === 'blocked') {
    const message = 'This accessibility request is not supported automatically. CAPTCHA challenges must be completed using the site or app’s provided accessible controls.';
    await addMessage(input.sessionId, 'assistant', message);
    input.onStatus?.('Request blocked by the accessibility safety policy.');
    return { capabilityId: 'device-info', success: false, message };
  }

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
