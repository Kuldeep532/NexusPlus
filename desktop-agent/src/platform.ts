import os from 'node:os';
import type { AgentCapabilities, Platform, ScreenReader } from './types';

export function detectPlatform(): Platform {
  switch (process.platform) {
    case 'win32': return 'windows';
    case 'darwin': return 'macos';
    default: return 'ubuntu';
  }
}

export function detectScreenReader(): ScreenReader {
  if (process.env.NEXUS_SCREEN_READER === 'nvda') return 'nvda';
  if (process.env.NEXUS_SCREEN_READER === 'orca') return 'orca';
  if (process.env.NEXUS_SCREEN_READER === 'voiceover') return 'voiceover';
  return 'unknown';
}

export function getCapabilities(): AgentCapabilities {
  const platform = detectPlatform();
  return {
    platform,
    screenReader: detectScreenReader(),
    keyboard: true,
    pointer: true,
    clipboard: true,
    voice: true,
    audio: true,
    screen: true,
    lock: true,
    unlock: false,
  };
}

export function getComputerName(): string { return os.hostname(); }
