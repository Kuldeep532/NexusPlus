import { getVoicePitchPresetCount, getVoicePitchProfile, normalizeVoicePitchParameters, type VoicePitchProfile } from './voicePitchingEngine';

/** Shared selection model for Fun Recordings, Voice Changer, and future audio voice changer flows. */
export type FunRecordingVoiceSelection = {
  profileId: string;
  profile: VoicePitchProfile;
};

export function createFunRecordingVoiceSelection(profileId: string): FunRecordingVoiceSelection {
  const profile = getVoicePitchProfile(profileId);
  if (!profile) throw new Error(`Voice profile '${profileId}' was not found.`);
  return { profileId, profile };
}

export function getFunRecordingVoiceInventory() {
  return getVoicePitchPresetCount();
}

export function getFunRecordingVoiceParameters(profileId: string) {
  const selection = createFunRecordingVoiceSelection(profileId);
  return normalizeVoicePitchParameters(selection.profile);
}
