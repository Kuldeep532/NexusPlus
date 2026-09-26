import { Platform } from 'react-native';
import { openURL } from 'expo-linking';
import * as Battery from 'expo-battery';
import { getAssistantCapability, type AssistantCapabilityId } from './agentCapabilities';
import { openAssistantTool, searchAssistantTools } from './assistantToolAdapter';
import { executeNativeMusicIntent, type MusicAction } from './musicIntent';
import type { CapabilityProposal } from './agentPlanner';
import { setAssistantAlarm, openCalendarEventDraft } from './assistantNativeActions';
import { scheduleReminder } from '@/features/reminders/reminderScheduler';
import { registerReminder } from '@/features/reminders/reminderBackend';

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
    case 'play-media': {
      const action = proposal.args.action as MusicAction | undefined;
      if (!action) throw new Error('Music action is missing.');
      const success = await executeNativeMusicIntent({
        action,
        query: proposal.args.query,
      });
      return {
        capabilityId: proposal.capability.id,
        success,
        message: success
          ? action === 'play'
            ? 'Music playback started.'
            : action === 'next'
              ? 'Moved to the next track.'
              : action === 'previous'
                ? 'Moved to the previous track.'
                : action === 'pause'
                  ? 'Music paused.'
                  : action === 'resume'
                    ? 'Music resumed.'
                    : 'Music stopped.'
          : 'The selected music app does not support this Android music command.',
      };
    }
    case 'create-reminder': {
      const minutes = Math.max(1, Number(proposal.args.delayMinutes ?? '5'));
      const clockHour = proposal.args.hour ? Number(proposal.args.hour) : NaN;
      const clockMinute = proposal.args.minute ? Number(proposal.args.minute) : NaN;
      let scheduledFor: string | undefined;
      let delayMinutes = minutes;
      if (Number.isFinite(clockHour) && Number.isFinite(clockMinute)) {
        const target = new Date();
        target.setHours(clockHour, clockMinute, 0, 0);
        if (target.getTime() <= Date.now()) target.setDate(target.getDate() + 1);
        scheduledFor = target.toISOString();
        delayMinutes = Math.max(1, Math.ceil((target.getTime() - Date.now()) / 60000));
      }
      const message = proposal.args.message || 'Nexus Assistant reminder';
      const reminderTitle = message
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 80) || 'Nexus Reminder';
      const item = await scheduleReminder({
        title: reminderTitle,
        body: message,
        delayMinutes: String(delayMinutes),
        language: /[\u0900-\u097F]/.test(message) ? 'hi-IN' : 'en-US',
        scheduleKind: scheduledFor ? 'at' : 'delay',
        scheduledFor,
      });
      await registerReminder(item);
      return {
        capabilityId: proposal.capability.id,
        success: true,
        message: scheduledFor ? `Reminder scheduled for ${item.scheduledAt}.` : `Reminder set for ${delayMinutes} minutes from now.`,
      };
    }
    case 'set-alarm': {
      const hour = Number(proposal.args.hour);
      const minute = Number(proposal.args.minute ?? '0');
      if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
        return { capabilityId: proposal.capability.id, success: false, message: 'Please include the alarm time, for example 5 PM.' };
      }
      const message = await setAssistantAlarm(hour, minute);
      return { capabilityId: proposal.capability.id, success: /scheduled/i.test(message), message };
    }
    case 'calendar-event': {
      const title = proposal.args.title || 'Nexus Assistant event';
      const message = await openCalendarEventDraft({ title });
      return { capabilityId: proposal.capability.id, success: /prepared/i.test(message), message };
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
