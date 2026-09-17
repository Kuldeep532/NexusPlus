import { getVisionAssistCapability, type VisionAssistCapability } from './visionAssistCapabilities';
import { planCapability, type CapabilityProposal } from '@/features/nexus-assistant/agentPlanner';

export interface VisionAssistIntent {
  capability: VisionAssistCapability;
  assistantProposal?: CapabilityProposal;
  reason: string;
}

/** Small adapter layer: Nexus Assistant remains the shared planner/executor. */
export function planVisionAssistIntent(text: string): VisionAssistIntent | null {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return null;

  let capabilityId: Parameters<typeof getVisionAssistCapability>[0] | null = null;
  if (/describe (this )?screen|what('?s| is) on (my|the) screen|screen description|स्क्रीन.*बताओ/i.test(normalized)) capabilityId = 'describe-screen';
  else if (/describe (this )?image|image description|picture description|तस्वीर.*बताओ/i.test(normalized)) capabilityId = 'describe-image';
  else if (/describe (this )?video|video description|वीडियो.*बताओ/i.test(normalized)) capabilityId = 'describe-video';
  else if (/copy.*captcha|captcha.*copy|कैप्चा.*कॉपी/i.test(normalized)) capabilityId = 'copy-captcha-text';
  else if (/read captcha|captcha.*(read|tell|show)|कैप्चा.*(पढ़|बताओ)/i.test(normalized)) capabilityId = 'read-captcha';
  else if (/captcha|कैप्चा/i.test(normalized)) capabilityId = 'assist-captcha';
  else if (/next control|move focus|अगला.*कंट्रोल/i.test(normalized)) capabilityId = 'navigate-accessibility-tree';
  else if (/activate|click focused|press focused|फोकस.*(क्लिक|दब)|कंट्रोल.*चलाओ/i.test(normalized)) capabilityId = 'activate-accessibility-control';

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
