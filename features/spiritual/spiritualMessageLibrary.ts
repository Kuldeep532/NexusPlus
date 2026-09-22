import type { GitaVerse } from '@/features/geeta-nexus/geetaTypes';
import { loadCachedVerseBundle } from '@/features/geeta-nexus/geetaStage5Repository';

export interface SpiritualMessage {
  id: string;
  text: string;
  source?: string;
  chapter?: number;
  verse?: number;
}

const REFLECTIONS: SpiritualMessage[] = [
  { id:'reflection-1', text:'आज अपने कर्म को ईमानदारी और शांत मन से करने का संकल्प लें।', source:'Daily Gita reflection' },
  { id:'reflection-2', text:'सुख और दुःख में समभाव का अभ्यास करें और अपने मन को स्थिर रखें।', source:'Daily Gita reflection' },
  { id:'reflection-3', text:'आज किसी एक कार्य को सेवा-भाव से करें, बिना केवल अपने लाभ पर ध्यान दिए।', source:'Daily Gita reflection' },
  { id:'reflection-4', text:'कुछ क्षण शांत होकर अपने भीतर के विचारों को देखें और श्वास पर ध्यान दें।', source:'Daily spiritual reflection' },
];

function dayIndex(date: Date, length: number): number {
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
  return ((day % length) + length) % length;
}

export function getDailySpiritualMessage(date = new Date()): SpiritualMessage {
  return REFLECTIONS[dayIndex(date, REFLECTIONS.length)];
}

export function chooseGitaVerse(verses: GitaVerse[], date = new Date(), offset = 0): SpiritualMessage | null {
  if (!verses.length) return null;
  const index = (dayIndex(date, verses.length) + offset) % verses.length;
  const verse = verses[index];
  const text = verse.translationHindi || verse.meaningHindi || verse.sanskrit;
  return {
    id: verse.id,
    text,
    source: `Bhagavad Gita — अध्याय ${verse.chapter}, श्लोक ${verse.verse}`,
    chapter: verse.chapter,
    verse: verse.verse,
  };
}

export async function getCurrentGitaMessage(date = new Date(), offset = 0): Promise<SpiritualMessage> {
  const cached = await loadCachedVerseBundle();
  return chooseGitaVerse(cached?.verses ?? [], date, offset) ?? getDailySpiritualMessage(date);
}
