import { addMessage } from './assistantStore';
import { executeCapability, type ExecutionResult } from './agentExecutor';
import { formatCapabilityConfirmation, planCapability, type CapabilityProposal } from './agentPlanner';
import { describeCurrentScreen } from '@/features/nexus-vision-assist/visionAssistScreen';
import { planVisionAssistIntent } from '@/features/nexus-vision-assist/visionAssistAgent';
import { readCaptchaText } from '@/features/nexus-vision-assist/visionAssistCaptcha';
import { copyAccessibleText } from '@/features/nexus-vision-assist/visionAssistClipboard';
import { handleVoiceTranscriptCommand } from './stage7VoiceBridge';
import { answerNexusIdentityQuestion } from './nexusKnowledge';
import { executeAssistantPdfCommand, parseAssistantPdfCommand, type AssistantPdfAttachment } from './pdfAssistantCommands';

export type Stage3AgentInput = {
  sessionId: string;
  userText: string;
  confirmed?: boolean;
  proposal?: CapabilityProposal;
  onStatus?: (message: string) => void;
  onProposal?: (message: string) => void;
  pdfAttachment?: AssistantPdfAttachment | null;
};

function unsupportedVisionResult(message: string): ExecutionResult {
  return { capabilityId: 'device-info', success: false, message };
}

export async function runStage3Agent(input: Stage3AgentInput): Promise<ExecutionResult | null> {
  const identity = answerNexusIdentityQuestion(input.userText);
  if (identity) {
    await addMessage(input.sessionId, 'assistant', identity);
    input.onStatus?.('Answered from Nexus local product knowledge.');
    return { capabilityId: 'device-info', success: true, message: identity };
  }

  const pdfCommand = parseAssistantPdfCommand(input.userText);
  if (pdfCommand) {
    if (!input.pdfAttachment) {
      const message = 'Attach a local PDF before running this PDF command.';
      await addMessage(input.sessionId, 'assistant', message);
      input.onStatus?.(message);
      return { capabilityId: 'pdf-lock', success: false, message };
    }
    if (!input.confirmed) {
      const title = pdfCommand.kind === 'lock' ? 'Lock PDF'
        : pdfCommand.kind === 'unlock' ? 'Unlock PDF'
        : pdfCommand.kind === 'compress' ? 'Compress PDF'
        : pdfCommand.kind === 'rotate' ? 'Rotate PDF'
        : 'PDF operation';
      const confirmation = title + ' requested. Confirm before I run this local PDF operation.';
      input.onProposal?.(confirmation);
      await addMessage(input.sessionId, 'assistant', confirmation);
      input.onStatus?.('Waiting for explicit confirmation.');
      return null;
    }
    try {
      const result = await executeAssistantPdfCommand(pdfCommand, input.pdfAttachment);
      await addMessage(input.sessionId, 'assistant', result.message);
      input.onStatus?.('PDF operation completed locally.');
      const capabilityId = pdfCommand.kind === 'lock' ? 'pdf-lock'
        : pdfCommand.kind === 'unlock' ? 'pdf-unlock'
        : pdfCommand.kind === 'compress' ? 'pdf-compress'
        : 'pdf-rotate';
      return { capabilityId, success: true, message: result.message };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'PDF operation failed.';
      await addMessage(input.sessionId, 'assistant', message);
      input.onStatus?.(message);
      throw error;
    }
  }

  const voiceHandled = await handleVoiceTranscriptCommand(input.userText).catch(() => false);
  if (voiceHandled) {
    const message = 'Media voice command executed.';
    await addMessage(input.sessionId, 'assistant', message);
    input.onStatus?.(message);
    return { capabilityId: 'play-media', success: true, message };
  }

  const visionIntent = planVisionAssistIntent(input.userText);
  if (visionIntent?.capability.id === 'describe-screen') {
    input.onStatus?.('Reading the current screen through Android accessibility semantics.');
    const result = await describeCurrentScreen();
    await addMessage(input.sessionId, 'assistant', result.description);
    input.onStatus?.(result.available ? 'Screen context read successfully.' : 'Screen context is unavailable.');
    return unsupportedVisionResult(result.description);
  }

  if (visionIntent?.capability.id === 'read-captcha' || visionIntent?.capability.id === 'copy-captcha-text') {
    input.onStatus?.('Reading accessible CAPTCHA text.');
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
      const message = 'CAPTCHA text: ' + captcha.text;
      await addMessage(input.sessionId, 'assistant', message);
      return unsupportedVisionResult(message);
    }
    const copied = await copyAccessibleText(captcha.text);
    const message = copied ? 'CAPTCHA text copied: ' + captcha.text : 'The CAPTCHA text could not be copied.';
    await addMessage(input.sessionId, 'assistant', message);
    return unsupportedVisionResult(message);
  }

  if (visionIntent?.capability.risk === 'blocked') {
    const message = 'This accessibility request is not supported automatically. CAPTCHA challenges must be completed using the site or app provided accessible controls.';
    await addMessage(input.sessionId, 'assistant', message);
    return unsupportedVisionResult(message);
  }

  const proposal = input.proposal ?? planCapability(input.userText);
  if (!proposal) {
    input.onStatus?.('No registered action matched. Gemini or local assistant inference can handle the question.');
    return null;
  }
  if (proposal.requiresConfirmation && !input.confirmed) {
    const confirmation = formatCapabilityConfirmation(proposal);
    input.onProposal?.(confirmation);
    await addMessage(input.sessionId, 'assistant', confirmation);
    input.onStatus?.('Waiting for explicit confirmation before running the action.');
    return null;
  }

  input.onStatus?.('Running ' + proposal.capability.title + ' locally.');
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
