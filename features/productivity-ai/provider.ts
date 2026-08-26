import { callGateway, discoverGatewayEndpoints, type GatewayEndpoint } from '@/features/api-gateway/apiGatewayClient';
import { WorkflowPlan } from './workflowEngine';

export interface ProductivityProvider {
  sendEmail(input: { to: string; subject: string; body: string }): Promise<{ id: string }>;
  createMeeting(input: { title: string; startIso: string; endIso: string; attendees: string[]; description?: string }): Promise<{ id: string; url?: string }>;
  listCalendar(input: { fromIso: string; toIso: string }): Promise<Array<{ id: string; title: string; startIso: string; endIso: string }>>;
  cancelCalendarEvent(eventId: string): Promise<void>;
}

function findEndpoint(endpoints: GatewayEndpoint[], feature: string, action: string): GatewayEndpoint {
  const featureKey = feature.toLowerCase();
  const actionKey = action.toLowerCase();
  const match = endpoints.find((endpoint) => {
    const haystack = `${endpoint.id} ${endpoint.path} ${endpoint.feature ?? ''} ${endpoint.description ?? ''}`.toLowerCase();
    return haystack.includes(featureKey) && haystack.includes(actionKey);
  });
  if (!match) throw new Error(`GATEWAY_ENDPOINT_NOT_FOUND:${feature}:${action}`);
  return match;
}

async function invokeProductivityEndpoint<T>(feature: string, action: string, body: unknown): Promise<T> {
  const endpoints = await discoverGatewayEndpoints();
  const endpoint = findEndpoint(endpoints, feature, action);
  return callGateway<T>(endpoint.path, { method: endpoint.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', body });
}

/** Credentials remain outside the workflow layer. Providers use only the gateway contract. */
export class GatewayProductivityProvider implements ProductivityProvider {
  async sendEmail(input: { to: string; subject: string; body: string }): Promise<{ id: string }> {
    return invokeProductivityEndpoint('email', 'send', input);
  }

  async createMeeting(input: { title: string; startIso: string; endIso: string; attendees: string[]; description?: string }): Promise<{ id: string; url?: string }> {
    return invokeProductivityEndpoint('calendar', 'create', input);
  }

  async listCalendar(input: { fromIso: string; toIso: string }): Promise<Array<{ id: string; title: string; startIso: string; endIso: string }>> {
    return invokeProductivityEndpoint('calendar', 'list', input);
  }

  async cancelCalendarEvent(eventId: string): Promise<void> {
    await invokeProductivityEndpoint('calendar', 'cancel', { eventId });
  }
}

export class UnconfiguredProductivityProvider implements ProductivityProvider {
  async sendEmail(): Promise<{ id: string }> { throw new Error('EMAIL_PROVIDER_NOT_CONFIGURED'); }
  async createMeeting(): Promise<{ id: string }> { throw new Error('CALENDAR_PROVIDER_NOT_CONFIGURED'); }
  async listCalendar(): Promise<never[]> { throw new Error('CALENDAR_PROVIDER_NOT_CONFIGURED'); }
  async cancelCalendarEvent(): Promise<void> { throw new Error('CALENDAR_PROVIDER_NOT_CONFIGURED'); }
}

export async function executeWorkflow(plan: WorkflowPlan, provider: ProductivityProvider, drafts = new Map<string, { to: string; subject: string; body: string }>) {
  const results: unknown[] = [];
  for (const step of plan.steps) {
    if (step.requiresUserConfirmation) throw new Error(`CONFIRMATION_REQUIRED:${step.id}`);
    if (step.action.type === 'compose_email') {
      const { composeMessage } = await import('./aiMessageComposer');
      const draft = composeMessage(step.action.context);
      const draftId = step.id;
      drafts.set(draftId, { to: step.action.to, subject: draft.subject, body: draft.body });
      results.push({ stepId: step.id, type: 'email_draft', draftId, ...draft });
    } else if (step.action.type === 'send_email') {
      const draft = drafts.get(step.action.draftId);
      if (!draft) throw new Error('EMAIL_DRAFT_NOT_FOUND');
      results.push({ stepId: step.id, type: 'email_sent', ...(await provider.sendEmail(draft)) });
    } else if (step.action.type === 'create_meeting') {
      results.push({ stepId: step.id, type: 'meeting_created', ...(await provider.createMeeting(step.action)) });
    } else if (step.action.type === 'calendar_list') {
      results.push({ stepId: step.id, type: 'calendar', events: await provider.listCalendar(step.action) });
    } else if (step.action.type === 'calendar_cancel') {
      await provider.cancelCalendarEvent(step.action.eventId); results.push({ stepId: step.id, type: 'calendar_cancelled' });
    }
  }
  return results;
}
