import { addMessage } from './assistantStore';
import { executeCapability, type ExecutionResult } from './agentExecutor';
import { formatCapabilityConfirmation, planCapability, type CapabilityProposal } from './agentPlanner';
import { describeCurrentScreen } from '@/features/nexus-vision-assist/visionAssistScreen';
import { planVisionAssistIntent } from '@/features/nexus-vision-assist/visionAssistAgent';
import { readCaptchaText } from '@/features/nexus-vision-assist/visionAssistCaptcha';
import { copyAccessibleText } from '@/features/nexus-vision-assist/visionAssistClipboard';

export type Stage3AgentInput = {
  sessionId: string;
  userText: string;
  confirmed?: boolean;
  proposal?: CapabilityProposal;
  onStatus?: (message: string) => void;
  onProposal?: (message: string) => void;
};

function unsupportedVisionResult(message: string): ExecutionResult {
  return { capabilityId: 'device-info', success: false, message };
}

/** Shared execution entry point for Nexus Assistant + Vision Assist. */
export async function runStage3Agent(input: Stage3AgentInput): Promise<ExecutionResult | null> {
  const visionIntent = planVisionAssistIntent(input.userText);

  if (visionIntent?.capability.id === 'describe-screen') {
    input.onStatus?.('Reading the current screen through Android accessibility semantics…');
    const result = await describeCurrentScreen();
    await addMessage(input.sessionId, 'assistant', result.description);
    input.onStatus?.(result.available ? 'Screen context read successfully.' : 'Screen context is unavailable.');
    return unsupportedVisionResult(result.description);
  }

  if (visionIntent?.capability.id === 'read-captcha' || visionIntent?.capability.id === 'copy-captcha-text') {
    input.onStatus?.('Reading accessible CAPTCHA text…');
    const screen = await describeCurrentScreen();
    if (!screen.available) {
      await addMessage(input.sessionId, 'assistant', screen.description);
      return unsupportedVisionResult(screen.description);
    }
    const captcha = readCaptchaText(screen.description);
    if (!captcha.detected || !captcha.text) {
      await addMessage(input.sessionId, 'assistant', captcha.message);
      return unsupportedVisionResult(captcha.message);
    }
    if (visionIntent.capability.id === 'read-captcha') {
      await addMessage(input.sessionId, 'assistant', `CAPTCHA text: ${captcha.text}`);
      input.onStatus?.('Accessible CAPTCHA text read.');
      return unsupportedVisionResult(`CAPTCHA text: ${captcha.text}`);
    }
    const copied = await copyAccessibleText(captcha.text);
    const message = copied ? `CAPTCHA text copied: ${captcha.text}` : 'The CAPTCHA text could not be copied.';
    await addMessage(input.sessionId, 'assistant', message);
    input.onStatus?.(copied ? 'CAPTCHA text copied.' : 'Copy failed.');
    return unsupportedVisionResult(message);
  }

  if (visionIntent?.capability.risk === 'blocked') {
    const message = 'This accessibility request is not supported automatically. CAPTCHA challenges must be completed using the site or app’s provided accessible controls.';
    await addMessage(input.sessionId, 'assistant', message);
    input.onStatus?.('Request blocked by the accessibility safety policy.');
    return unsupportedVisionResult(message);
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
