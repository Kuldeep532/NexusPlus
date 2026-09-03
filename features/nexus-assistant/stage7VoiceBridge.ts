import { NativeEventEmitter, NativeModules, PermissionsAndroid, Platform } from 'react-native';
import type { Stage6VoiceBridge } from './stage6Voice';

export type VoiceRuntimeStatus = {
  state: 'idle' | 'listening' | 'processing' | 'error';
  error?: string | null;
};

type NativeVoiceModule = {
  isAvailable(): Promise<boolean>;
  startListening(): Promise<void>;
  stopListening(): Promise<void>;
  stopOutput(): Promise<void>;
  speak(text: string): Promise<void>;
};

const nativeVoice = NativeModules.NexusAssistantVoice as NativeVoiceModule | undefined;

async function ensureMicrophonePermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  const permission = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;
  if (await PermissionsAndroid.check(permission)) return true;
  const result = await PermissionsAndroid.request(permission, {
    title: 'Nexus Assistant microphone',
    message: 'Nexus Assistant needs microphone access for Voice Input and Live Mode.',
    buttonPositive: 'Allow',
    buttonNegative: 'Cancel',
  });
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

export function createStage7VoiceBridge(
  onStatus?: (status: VoiceRuntimeStatus) => void,
  onTranscript?: (text: string) => void,
): { bridge: Stage6VoiceBridge; dispose: () => void } {
  if (!nativeVoice) {
    return {
      bridge: {
        async isAvailable() { return false; },
        async startListening() { throw new Error('VOICE_NATIVE_MODULE_UNAVAILABLE'); },
        async stopListening() {},
        async stopOutput() {},
        async speak() { throw new Error('VOICE_NATIVE_MODULE_UNAVAILABLE'); },
      },
      dispose() {},
    };
  }

  const emitter = new NativeEventEmitter(NativeModules.NexusAssistantVoice);
  const subscription = emitter.addListener('NexusAssistantVoiceState', (payload: VoiceRuntimeStatus & { transcript?: string }) => {
    onStatus?.(payload);
    if (payload.transcript) onTranscript?.(payload.transcript);
  });

  return {
    bridge: {
      async isAvailable() {
        return (await ensureMicrophonePermission()) && nativeVoice.isAvailable();
      },
      async startListening() {
        if (!(await ensureMicrophonePermission())) throw new Error('MIC_PERMISSION_REQUIRED');
        await nativeVoice.startListening();
      },
      async stopListening() {
        await nativeVoice.stopListening();
        onStatus?.({ state: 'idle' });
      },
      async stopOutput() {
        await nativeVoice.stopOutput();
      },
      async speak(text: string) {
        await nativeVoice.speak(text);
      },
    },
    dispose() {
      subscription.remove();
    },
  };
}
