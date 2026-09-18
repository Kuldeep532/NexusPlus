import { Platform } from 'react-native';
import { openURL } from 'expo-linking';
import * as Battery from 'expo-battery';
import { getAssistantCapability, type AssistantCapabilityId } from './agentCapabilities';
import { openAssistantTool, searchAssistantTools } from './assistantToolAdapter';
import type { CapabilityProposal } from './agentPlanner';

export type ExecutionContext = {
  confirmed: boolean;
};

export type ExecutionResult = {
  capabilityId: AssistantCapabilityId;
  success: boolean;
  message: string;
};

function assertAllowed(proposal: CapabilityProposal, context: ExecutionContext): void {
  const capability = getAssistantCapability(proposal.capability.id);
  if (!capability) throw new Error('Unknown Nexus Assistant capability.');
  if (capability.risk === 'blocked') throw new Error('This capability is blocked.');
  if (capability.requiresConfirmation && !context.confirmed) {
    throw new Error('User confirmation is required before this action can run.');
  }
}

export async function executeCapability(
  proposal: CapabilityProposal,
  context: ExecutionContext,
): Promise<ExecutionResult> {
  assertAllowed(proposal, context);

  switch (proposal.capability.id) {
    case 'battery-status': {
      const level = await Battery.getBatteryLevelAsync();
      const state = await Battery.getBatteryStateAsync();
      return {
        capabilityId: proposal.capability.id,
        success: true,
        message: `Battery ${Math.round(level * 100)}%. State: ${Battery.BatteryState[state] ?? 'unknown'}.`,
      };
    }
    case 'device-info':
      return {
        capabilityId: proposal.capability.id,
        success: true,
        message: `Platform: ${Platform.OS}. Device capability access is limited to explicitly registered actions.`,
      };
    case 'open-url': {
      const url = proposal.args.url;
      if (!url) throw new Error('A URL is required.');
      if (!/^https?:\/\//i.test(url)) throw new Error('Only HTTP(S) URLs are allowed.');
      await openURL(url);
      return { capabilityId: proposal.capability.id, success: true, message: 'The link was opened.' };
    }
    case 'qr-generate': {
      const qr = searchAssistantTools('Generate QR Code').find((item) => item.id === 'qr-code');
      if (!qr?.route) throw new Error('The existing QR generator is not registered.');
      openAssistantTool(qr);
      return { capabilityId: proposal.capability.id, success: true, message: 'Opened the existing QR generator. You can enter the data manually or let Nexus Assistant prepare the payload.' };
    }
    case 'tool-open': {
      const toolId = proposal.args.toolId ?? '';
      const tool = searchAssistantTools(toolId).find((item) => item.id === toolId) ?? searchAssistantTools(proposal.args.route ?? '').find((item) => item.route === proposal.args.route);
      if (!tool?.route) throw new Error('Registered Nexus tool could not be resolved.');
      openAssistantTool(tool);
      return { capabilityId: proposal.capability.id, success: true, message: tool.title + ' opened.' };
    }
    default:
      return {
        capabilityId: proposal.capability.id,
        success: false,
        message: 'This capability is registered but its native executor is scheduled for a later Nexus Assistant stage.',
      };
  }
}
