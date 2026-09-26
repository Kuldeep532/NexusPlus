import { NativeEventEmitter, NativeModules, PermissionsAndroid, Platform } from 'react-native';
import * as Speech from 'expo-speech';
import type { Stage6VoiceBridge } from './stage6Voice';
import { getInstalledVoices } from '@/features/voice-library/voiceStore';
import { getAssistantVoiceProfile } from './voicePolicy';
import { getVoiceCommandsEnabled } from './voiceCommandSettings';
import { getAssistantVoicePreference } from './assistantVoicePreferences';
import { executeSystemMediaVoiceCommand, parseMediaVoiceCommand } from './mediaVoiceCommands';

type VoiceRole = 'live-call' | 'assistant';
export type VoiceRuntimeStatus = { state: 'idle' | 'listening' | 'processing' | 'error'; error?: string | null };
type NativeVoiceModule = { isAvailable(): Promise<boolean>; startListening(options?: { locales?: string[] }): Promise<void>; stopListening(): Promise<void>; stopOutput(): Promise<void>; speak(text: string, options?: { modelPath?: string; configPath?: string }): Promise<void>; };
const nativeVoice = NativeModules.NexusAssistantVoice as NativeVoiceModule | undefined;

async function ensureMicrophonePermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  const permission = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;
  if (await PermissionsAndroid.check(permission)) return true;
  const result = await PermissionsAndroid.request(permission, { title: 'Nexus Focus Assist microphone', message: 'Nexus Focus Assist uses the microphone only while a voice command is being captured.', buttonPositive: 'Allow', buttonNegative: 'Cancel' });
  return result === PermissionsAndroid.RESULTS.GRANTED;
}
async function resolveSpokenVoice(role: VoiceRole, locale: string) { const preference = await getAssistantVoicePreference(); const profile = role === 'live-call' ? getAssistantVoiceProfile(role, locale) : getAssistantVoiceProfile(role, locale); const installed = await getInstalledVoices().catch(() => []); const preferredId = preference.voiceId || profile.id; return { profile, preference, voice: installed.find((item) => item.id === preferredId) }; }
export function createStage7VoiceBridge(onStatus?: (status: VoiceRuntimeStatus) => void, onTranscript?: (text: string) => void): { bridge: Stage6VoiceBridge; dispose: () => void } {
  if (!nativeVoice) return { bridge: { async isAvailable() { return false; }, async startListening() { throw new Error('Voice calling is not available on this device.'); }, async stopListening() {}, async stopOutput() { await Speech.stop(); }, async speak(text: string) { await Speech.speak(text, { language: 'en-IN' }); } }, dispose() {} };
  const emitter = new NativeEventEmitter(NativeModules.NexusAssistantVoice);
  const subscription = emitter.addListener('NexusAssistantVoiceState', (payload: VoiceRuntimeStatus & { transcript?: string }) => { onStatus?.(payload); if (payload.transcript) onTranscript?.(payload.transcript); });
  return { bridge: {
    async isAvailable() { return (await getVoiceCommandsEnabled()) && (await ensureMicrophonePermission()) && nativeVoice.isAvailable(); },
    async startListening() { if (!(await getVoiceCommandsEnabled())) throw new Error('VOICE_COMMANDS_DISABLED'); if (!(await ensureMicrophonePermission())) throw new Error('MIC_PERMISSION_REQUIRED'); await nativeVoice.startListening({ locales: ['en-IN', 'hi-IN', 'en-US'] }); },
    async stopListening() { await nativeVoice.stopListening(); onStatus?.({ state: 'idle' }); },
    async stopOutput() { await nativeVoice.stopOutput().catch(() => undefined); await Speech.stop().catch(() => undefined); },
    async speak(text: string) { await nativeVoice.speak(text); },
  }, dispose() { subscription.remove(); void Speech.stop().catch(() => undefined); } };
}
export async function handleVoiceTranscriptCommand(text: string): Promise<boolean> { if (!(await getVoiceCommandsEnabled())) return false; const action = parseMediaVoiceCommand(text); if (!action) return false; return executeSystemMediaVoiceCommand(action); }
export async function speakAssistant(text: string, locale = 'en-US', role: VoiceRole = 'assistant'): Promise<'piper' | 'system'> { const normalized = text.trim(); if (!normalized) return 'system'; const { preference, voice } = await resolveSpokenVoice(role, locale); if (preference.mode === 'local' && nativeVoice && voice) { try { await nativeVoice.speak(normalized, { modelPath: voice.modelPath, configPath: voice.configPath }); return 'piper'; } catch { } } try { await Speech.stop().catch(() => undefined); await Speech.speak(normalized, { language: locale }); } catch { } return 'system'; }
