import { composeMessage, MessageContext } from './aiMessageComposer';

export type WorkflowAction =
  | { type: 'compose_email'; context: MessageContext; to: string }
  | { type: 'send_email'; draftId: string }
  | { type: 'create_meeting'; title: string; startIso: string; endIso: string; attendees: string[]; description?: string }
  | { type: 'calendar_list'; fromIso: string; toIso: string }
  | { type: 'calendar_cancel'; eventId: string };

export interface WorkflowStep { id: string; action: WorkflowAction; requiresUserConfirmation: boolean; }
export interface WorkflowPlan { id: string; steps: WorkflowStep[]; createdAt: number; mode: 'local' | 'provider'; }

const id = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Pattern-first workflow planner. It keeps orchestration deterministic and
 * delegates actual account operations to a provider adapter.
 */
export function buildProductivityWorkflow(input: {
  email?: { to: string; context: MessageContext };
  meeting?: { title: string; startIso: string; endIso: string; attendees: string[]; description?: string };
  calendar?: { fromIso: string; toIso: string };
  autoSend?: boolean;
}): WorkflowPlan {
  const steps: WorkflowStep[] = [];
  if (input.email) {
    const draftId = id();
    steps.push({ id: id(), action: { type: 'compose_email', to: input.email.to, context: input.email.context }, requiresUserConfirmation: false });
    steps.push({ id: draftId, action: { type: 'send_email', draftId }, requiresUserConfirmation: !input.autoSend });
  }
  if (input.meeting) steps.push({ id: id(), action: { type: 'create_meeting', ...input.meeting }, requiresUserConfirmation: true });
  if (input.calendar) steps.push({ id: id(), action: { type: 'calendar_list', ...input.calendar }, requiresUserConfirmation: false });
  return { id: id(), steps, createdAt: Date.now(), mode: 'local' };
}

export function renderEmailDraft(context: MessageContext) {
  return composeMessage(context);
}
