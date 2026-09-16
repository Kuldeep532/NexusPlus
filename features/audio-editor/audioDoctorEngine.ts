import { assertAudioEditorNative, type AudioDoctorNativeResult } from '@/modules/audio-editor-native';

export type AudioDoctorSettings = {
  noiseReduction: number;
  voiceClarity: number;
  humRemoval: number;
  deClip: number;
  autoGain: boolean;
};

export type AudioDoctorReport = AudioDoctorNativeResult;

export const DEFAULT_AUDIO_DOCTOR_SETTINGS: AudioDoctorSettings = {
  noiseReduction: 0.9,
  voiceClarity: 0.65,
  humRemoval: 0.85,
  deClip: 0.65,
  autoGain: true,
};

export function normalizeAudioDoctorSettings(settings: AudioDoctorSettings): AudioDoctorSettings {
  return {
    noiseReduction: Math.max(0, Math.min(1, settings.noiseReduction)),
    voiceClarity: Math.max(0, Math.min(1, settings.voiceClarity)),
    humRemoval: Math.max(0, Math.min(1, settings.humRemoval)),
    deClip: Math.max(0, Math.min(1, settings.deClip)),
    autoGain: Boolean(settings.autoGain),
  };
}

export async function diagnoseAndRepairAudio(
  inputPath: string,
  outputPath: string,
  settings: AudioDoctorSettings = DEFAULT_AUDIO_DOCTOR_SETTINGS,
  onProgress?: (stage: 'loading' | 'analyzing' | 'removing-noise' | 'fixing-hum' | 'fixing-clipping' | 'enhancing-voice' | 'fixing-volume' | 'mastering-sound' | 'saving') => void,
): Promise<AudioDoctorReport> {
  const native = assertAudioEditorNative();
  onProgress?.('loading');
  onProgress?.('analyzing');
  const report = await native.audioDoctor(inputPath, outputPath, normalizeAudioDoctorSettings(settings));
  onProgress?.('removing-noise');
  onProgress?.('fixing-hum');
  onProgress?.('fixing-clipping');
  onProgress?.('enhancing-voice');
  onProgress?.('fixing-volume');
  onProgress?.('mastering-sound');
  onProgress?.('saving');
  return report;
}
