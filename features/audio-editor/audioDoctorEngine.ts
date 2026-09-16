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
  noiseReduction: 0.75,
  voiceClarity: 0.55,
  humRemoval: 0.6,
  deClip: 0.4,
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
): Promise<AudioDoctorReport> {
  const native = assertAudioEditorNative();
  return native.audioDoctor(inputPath, outputPath, normalizeAudioDoctorSettings(settings));
}
