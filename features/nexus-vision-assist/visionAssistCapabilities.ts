export type VisionAssistRisk = 'safe' | 'confirm' | 'blocked';

export type VisionAssistCapabilityId =
  | 'describe-screen'
  | 'describe-image'
  | 'describe-video'
  | 'navigate-accessibility-tree'
  | 'activate-accessibility-control'
  | 'read-captcha'
  | 'copy-captcha-text'
  | 'assist-captcha';

export interface VisionAssistCapability {
  id: VisionAssistCapabilityId;
  title: string;
  description: string;
  risk: VisionAssistRisk;
  offline: boolean;
}

export const VISION_ASSIST_CAPABILITIES: VisionAssistCapability[] = [
  { id: 'describe-screen', title: 'Describe Screen', description: 'Read the current accessibility tree and summarize visible controls and text.', risk: 'safe', offline: true },
  { id: 'describe-image', title: 'Describe Image', description: 'Describe a user-selected image using the configured Nexus vision provider.', risk: 'safe', offline: false },
  { id: 'describe-video', title: 'Describe Video', description: 'Describe selected video content from sampled frames using the configured vision provider.', risk: 'safe', offline: false },
  { id: 'navigate-accessibility-tree', title: 'Navigate Accessibility Controls', description: 'Move accessibility focus between exposed controls.', risk: 'safe', offline: true },
  { id: 'activate-accessibility-control', title: 'Activate Accessibility Control', description: 'Activate a focused control after explicit user confirmation when it can cause an external side effect.', risk: 'confirm', offline: true },
  { id: 'read-captcha', title: 'Read CAPTCHA Text', description: 'Read CAPTCHA or verification text only when it is exposed through accessibility semantics.', risk: 'safe', offline: true },
  { id: 'copy-captcha-text', title: 'Copy CAPTCHA Text', description: 'Copy accessible CAPTCHA text to the system clipboard after the user requests it.', risk: 'safe', offline: true },
  { id: 'assist-captcha', title: 'CAPTCHA Accessibility Assistance', description: 'Identify a CAPTCHA and explain accessible options; never solve or bypass an anti-bot challenge automatically.', risk: 'blocked', offline: true },
];

export function getVisionAssistCapability(id: VisionAssistCapabilityId) {
  return VISION_ASSIST_CAPABILITIES.find((capability) => capability.id === id);
}
