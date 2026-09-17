import { getVisionAssistCapability, type VisionAssistCapability } from './visionAssistCapabilities';
import { planCapability, type CapabilityProposal } from '@/features/nexus-assistant/agentPlanner';

export interface VisionAssistIntent {
  capability: VisionAssistCapability;
  assistantProposal?: CapabilityProposal;
  reason: string;
}

/**
 * Small ElizaOS-aligned adapter layer. Nexus Assistant remains the shared
 * planner/executor; Vision Assist only adds vision/accessibility intents.
 */
export function planVisionAssistIntent(text: string): VisionAssistIntent | null {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return null;

  let capabilityId: Parameters<typeof getVisionAssistCapability>[0] | null = null;
  if (/describe (this )?screen|what('?s| is) on (my|the) screen|screen description|स्क्रीन.*बताओ/i.test(normalized)) capabilityId = 'describe-screen';
  else if (/describe (this )?image|image description|picture description|तस्वीर.*बताओ/i.test(normalized)) capabilityId = 'describe-image';
  else if (/describe (this )?video|video description|वीडियो.*बताओ/i.test(normalized)) capabilityId = 'describe-video';
  else if (/captcha|कैप्चा/i.test(normalized)) capabilityId = 'assist-captcha';
  else if (/next control|move focus|अगला.*कंट्रोल/i.test(normalized)) capabilityId = 'navigate-accessibility-tree';

  if (!capabilityId) return null;
  const capability = getVisionAssistCapability(capabilityId);
  if (!capability) return null;

  return {
    capability,
    assistantProposal: planCapability(text) ?? undefined,
    reason: capability.risk === 'blocked'
      ? 'This request is limited to safe accessibility assistance.'
      : `Nexus Vision Assist selected ${capability.title}.`,
  };
}
