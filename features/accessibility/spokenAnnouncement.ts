import { AccessibilityInfo } from 'react-native';

const EMOJI_PATTERN = /[\u{1F1E6}-\u{1F1FF}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu;

export function cleanSpokenAnnouncement(value: string): string {
  return value
    .replace(EMOJI_PATTERN, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function announceClean(value: string): void {
  const clean = cleanSpokenAnnouncement(value);
  if (clean) AccessibilityInfo.announceForAccessibility(clean);
}
