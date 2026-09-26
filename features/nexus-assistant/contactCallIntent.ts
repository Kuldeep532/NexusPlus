import { NativeModules, Platform } from 'react-native';

export type ContactMatch = {
  id: string;
  name: string;
  phone: string;
};

type NexusContactsCallBridge = {
  findContacts?: (query: string) => Promise<ContactMatch[]>;
  requestContactsPermission?: () => Promise<boolean>;
  requestCallPermission?: () => Promise<boolean>;
  directCall?: (phone: string) => Promise<boolean>;
  dial?: (phone: string) => Promise<boolean>;
};

const native = NativeModules.NexusContactsCall as NexusContactsCallBridge | undefined;

const ROLE_ALIASES: Record<string, string[]> = {
  father: ['father', 'dad', 'daddy', 'papa', 'papaji', 'पिता', 'पापा', 'पिताजी'],
  mother: ['mother', 'mom', 'mummy', 'mumma', 'maa', 'mama', 'माँ', 'मम्मी', 'माता'],
  sister: ['sister', 'sis', 'बहन', 'दीदी'],
  brother: ['brother', 'bhai', 'भाई'],
  wife: ['wife', 'पत्नी'],
  husband: ['husband', 'पति'],
  son: ['son', 'बेटा'],
  daughter: ['daughter', 'बेटी'],
};

export function extractCallTarget(text: string): string | null {
  const match = /(?:call|phone|dial|contact|कॉल|फोन|डायल)\s+(?:my\s+|the\s+|मेरे\s+|मेरी\s+)?(.+?)\s*(?:को)?$/i.exec(text.trim());
  return match?.[1]?.trim() ?? null;
}

export function normalizeContactQuery(target: string): string {
  const normalized = target.toLowerCase().trim();
  for (const [canonical, aliases] of Object.entries(ROLE_ALIASES)) {
    if (aliases.some((alias) => normalized === alias || normalized.includes(alias))) return canonical;
  }
  return target.trim();
}

export async function findMatchingContacts(target: string): Promise<ContactMatch[]> {
  if (Platform.OS !== 'android' || !native?.findContacts) return [];
  const normalized = normalizeContactQuery(target);
  const direct = await native.findContacts(normalized);
  if (direct.length || normalized === target.trim()) return direct;
  return native.findContacts(target.trim());
}

export async function callContact(target: string): Promise<{ success: boolean; message: string }> {
  if (Platform.OS !== 'android' || !native) {
    return { success: false, message: 'Contact calling is available on Android only.' };
  }
  const contactsAllowed = await native.requestContactsPermission?.() ?? false;
  if (!contactsAllowed) {
    return { success: false, message: 'Contacts permission is required so Nexus Assistant can find the requested person.' };
  }
  const callAllowed = await native.requestCallPermission?.() ?? false;
  if (!callAllowed) {
    return { success: false, message: 'Phone permission is required for direct calling.' };
  }

  const matches = await findMatchingContacts(target);
  if (!matches.length) {
    return { success: false, message: 'I could not find a saved contact matching “' + target + '”.' };
  }
  if (matches.length > 1) {
    const names = matches.slice(0, 3).map((item) => item.name).join(', ');
    return { success: false, message: 'I found multiple contacts matching “' + target + '”: ' + names + '. Please use the full contact name.' };
  }
  const match = matches[0];
  const called = await native.directCall?.(match.phone) ?? false;
  return called
    ? { success: true, message: 'Calling ' + match.name + '.' }
    : { success: false, message: 'The call to ' + match.name + ' could not be started.' };
}
