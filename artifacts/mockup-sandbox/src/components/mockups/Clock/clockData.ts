export type Alarm = {
  id: string;
  hour: number;
  minute: number;
  label: string;
  repeat: string[];
  enabled: boolean;
  ringtoneId: string;
};

export type Ringtone = {
  id: string;
  label: string;
  fileName?: string;
  source: "system" | "custom";
};

export const ringTones: Ringtone[] = [
  { id: "system", label: "System ringtone", source: "system" },
  { id: "first-light-at-the-brook", label: "First Light at the Brook", fileName: "first_light_at_the_brook.mp3", source: "custom" },
  { id: "first-light-by-the-river", label: "First Light by the River", fileName: "first_light_by_the_river.mp3", source: "custom" },
  { id: "lotus-petal-drift", label: "Lotus Petal Drift", fileName: "lotus_petal_drift.mp3", source: "custom" },
  { id: "before-the-meadow-stirs", label: "Before the Meadow Stirs", fileName: "before_the_meadow_stirs.mp3", source: "custom" },
  { id: "shoreline-awakening", label: "Shoreline Awakening", fileName: "shoreline_awakening.mp3", source: "custom" },
  { id: "tides-at-daybreak", label: "Tides at Daybreak", fileName: "tides_at_daybreak.mp3", source: "custom" },
];

export const defaultAlarms: Alarm[] = [
  { id: "morning", hour: 5, minute: 30, label: "Morning", repeat: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], enabled: false, ringtoneId: "first-light-at-the-brook" },
  { id: "walk", hour: 8, minute: 0, label: "Morning walk", repeat: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], enabled: false, ringtoneId: "lotus-petal-drift" },
];

export function formatTime(hour: number, minute: number): string {
  const suffix = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;
  return `${h}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export function humanizeAudioName(fileName?: string): string {
  if (!fileName) return "";
  return fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
