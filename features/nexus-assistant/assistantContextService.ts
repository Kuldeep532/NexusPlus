import type { BookAssistantContext } from './bookContext';
import type { ActiveFileContext } from './fileAssistantStore';
import { getActiveBookContext } from './bookAssistantStore';
import { getActiveFileContext } from './fileAssistantStore';
import { buildContextPrompt } from './contextRouter';

export type ResolvedAssistantContext = {
  book: BookAssistantContext | null;
  file: ActiveFileContext | null;
  prompt: string;
};

/** Resolve all currently selected local context sources for one Assistant request. */
export async function getResolvedAssistantContext(): Promise<ResolvedAssistantContext> {
  const [book, file] = await Promise.all([
    getActiveBookContext(),
    getActiveFileContext(),
  ]);

  return {
    book,
    file,
    prompt: buildContextPrompt({ book, file }),
  };
}
