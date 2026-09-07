import { Platform } from 'react-native';
import { openURL } from 'expo-linking';
import * as Battery from 'expo-battery';
import { getAssistantCapability, type AssistantCapabilityId } from './agentCapabilities';
import type { CapabilityProposal } from './agentPlanner';
import { executeComputerAgentAction, type ComputerAgentInfo } from './computerAgent';

export type ExecutionContext = {
  confirmed: boolean;
  computerAgent?: ComputerAgentInfo | null;
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

function requireComputerAgent(context: ExecutionContext): ComputerAgentInfo {
  if (!context.computerAgent) {
    throw new Error('No Nexus Computer Agent is connected. Connect the computer and keep it on the same reachable local network.');
  }
  return context.computerAgent;
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
    case 'computer-status': {
      const agent = requireComputerAgent(context);
      const result = await executeComputerAgentAction(agent, { action: 'system-info' });
      return { capabilityId: proposal.capability.id, success: result.ok, message: result.message ?? 'Computer status received.' };
    }
    case 'computer-open-url': {
      const url = proposal.args.url;
      if (!url) throw new Error('A URL is required.');
      if (!/^https?:\/\//i.test(url)) throw new Error('Only HTTP(S) URLs are allowed.');
      const agent = requireComputerAgent(context);
      const result = await executeComputerAgentAction(agent, { action: 'open-url', args: { url } });
      return { capabilityId: proposal.capability.id, success: result.ok, message: result.message ?? 'The URL was opened on the computer.' };
    }
    case 'computer-open-file': {
      const path = proposal.args.path;
      if (!path) throw new Error('A file path is required.');
      const agent = requireComputerAgent(context);
      const result = await executeComputerAgentAction(agent, { action: 'open-file', args: { path } });
      return { capabilityId: proposal.capability.id, success: result.ok, message: result.message ?? 'The file was opened on the computer.' };
    }
    case 'computer-launch-app': {
      const app = proposal.args.app;
      if (!app) throw new Error('An application name is required.');
      const agent = requireComputerAgent(context);
      const result = await executeComputerAgentAction(agent, { action: 'launch-app', args: { app } });
      return { capabilityId: proposal.capability.id, success: result.ok, message: result.message ?? 'The application was launched on the computer.' };
    }
    default:
      return {
        capabilityId: proposal.capability.id,
        success: false,
        message: 'This capability is registered but its native executor is scheduled for a later Nexus Assistant stage.',
      };
  }
}
