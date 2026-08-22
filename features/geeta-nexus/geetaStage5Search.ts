import type { GitaVerse } from './geetaTypes';

export interface GitaSearchResult extends GitaVerse {
  score: number;
}

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}

export function searchGitaVerses(verses: GitaVerse[], query: string, limit = 30): GitaSearchResult[] {
  const needle = normalize(query.trim());
  if (!needle) return [];

  return verses
    .map((verse) => {
      const haystacks = [verse.sanskrit, verse.transliteration, verse.translationEnglish, verse.translationHindi, verse.meaningHindi]
        .filter(Boolean)
        .map((value) => normalize(value as string));
      let score = 0;
      for (const haystack of haystacks) {
        if (haystack === needle) score += 1;
        else if (haystack.includes(needle)) score += 0.5;
      }
      return { ...verse, score };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.chapter - b.chapter || a.verse - b.verse)
    .slice(0, limit);
}
