import {
  getVoicePitchProfile,
  getVoicePitchProfiles,
  normalizeVoicePitchParameters,
  type VoiceGender,
  type VoicePitchParameters,
  type VoicePitchProfile,
} from './voicePitchingEngine';

export type FunRecordingVoiceSelection = {
  profileId: string;
  profile: VoicePitchProfile;
};

export function createFunRecordingVoiceSelection(profileId: string): FunRecordingVoiceSelection {
  const profile = getVoicePitchProfile(profileId);
  if (!profile) {
    throw new Error(`Unknown voice profile: ${profileId}`);
  }
  return { profileId, profile };
}

export function getFunRecordingVoiceInventory(gender?: VoiceGender): VoicePitchProfile[] {
  return getVoicePitchProfiles(gender);
}

export function getFunRecordingVoiceParameters(profileId: string): VoicePitchParameters {
  const profile = getVoicePitchProfile(profileId);
  if (!profile) {
    throw new Error(`Unknown voice profile: ${profileId}`);
  }
  return normalizeVoicePitchParameters(profile);
}
