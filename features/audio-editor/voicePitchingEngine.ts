export type VoiceGender = 'female' | 'male';
export type VoiceStyle = 'natural' | 'warm' | 'bright' | 'deep' | 'soft' | 'clear';

export type VoicePitchProfile = {
  id: string;
  name: string;
  gender: VoiceGender;
  style: VoiceStyle;
  pitchSemitones: number;
  formantShift: number;
  timbre: number;
};

const FEMALE_NAMES = [
  'Aisha', 'Era', 'Mira', 'Nora', 'Riya', 'Anaya', 'Sara', 'Tara', 'Isha', 'Meera',
  'Kiara', 'Aanya', 'Zoya', 'Myra', 'Nia', 'Alina', 'Diya', 'Lina', 'Ava', 'Lara',
];

const MALE_NAMES = [
  'Arin', 'Evan', 'Leo', 'Ryan', 'Aarav', 'Noah', 'Rohan', 'Dev', 'Kabir', 'Arjun',
  'Neil', 'Ishan', 'Eli', 'Liam', 'Kian', 'Ayan', 'Sam', 'Ravi', 'Zayn', 'Omar',
];

const FEMALE_STYLES: VoiceStyle[] = ['natural', 'warm', 'bright', 'soft', 'clear'];
const MALE_STYLES: VoiceStyle[] = ['natural', 'warm', 'deep', 'soft', 'clear'];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function createProfiles(gender: VoiceGender, count: number): VoicePitchProfile[] {
  const names = gender === 'female' ? FEMALE_NAMES : MALE_NAMES;
  const styles = gender === 'female' ? FEMALE_STYLES : MALE_STYLES;
  const result: VoicePitchProfile[] = [];

  for (let index = 0; index < count; index += 1) {
    const name = names[index % names.length];
    const style = styles[index % styles.length];
    const cycle = Math.floor(index / names.length);
    const micro = (index * 7) % 13;

    const pitchBase = gender === 'female' ? 1.5 : -1.25;
    const pitchRange = gender === 'female' ? 5.5 : 5;
    const pitchSemitones = clamp(
      pitchBase + ((micro - 6) * pitchRange) / 6 + (cycle % 5) * 0.22,
      gender === 'female' ? -4 : -6,
      gender === 'female' ? 8 : 5,
    );

    const formantShift = clamp(
      pitchSemitones * 0.42 + (style === 'warm' ? -0.45 : style === 'bright' ? 0.5 : 0),
      -4,
      4,
    );
    const timbre = clamp(
      ((index * 11) % 101) / 100 + (style === 'soft' ? -0.08 : style === 'clear' ? 0.08 : 0),
      0,
      1,
    );

    result.push({
      id: `${gender}-${index + 1}`,
      name: `${name} ${String(cycle + 1).padStart(2, '0')}`,
      gender,
      style,
      pitchSemitones: Number(pitchSemitones.toFixed(2)),
      formantShift: Number(formantShift.toFixed(2)),
      timbre: Number(timbre.toFixed(2)),
    });
  }

  return result;
}

const FEMALE_PROFILES = createProfiles('female', 500);
const MALE_PROFILES = createProfiles('male', 500);

export const VOICE_PITCH_PROFILES: readonly VoicePitchProfile[] = [
  ...FEMALE_PROFILES,
  ...MALE_PROFILES,
];

export function getVoicePitchProfiles(filter?: VoiceGender): VoicePitchProfile[] {
  if (!filter) return [...VOICE_PITCH_PROFILES];
  return VOICE_PITCH_PROFILES.filter((profile) => profile.gender === filter);
}

export function getVoicePitchProfile(id: string): VoicePitchProfile | undefined {
  return VOICE_PITCH_PROFILES.find((profile) => profile.id === id);
}

export function getVoicePitchPresetCount(): { total: number; female: number; male: number } {
  return { total: VOICE_PITCH_PROFILES.length, female: FEMALE_PROFILES.length, male: MALE_PROFILES.length };
}

export type VoicePitchParameters = Pick<VoicePitchProfile, 'pitchSemitones' | 'formantShift' | 'timbre'>;

/** Reusable deterministic parameter normalization for future voice changer / recorder processors. */
export function normalizeVoicePitchParameters(parameters: VoicePitchParameters): VoicePitchParameters {
  return {
    pitchSemitones: clamp(parameters.pitchSemitones, -8, 8),
    formantShift: clamp(parameters.formantShift, -4, 4),
    timbre: clamp(parameters.timbre, 0, 1),
  };
}
