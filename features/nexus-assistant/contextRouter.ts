import type { BookAssistantContext } from './bookContext';
import type { ActiveFileContext } from './fileAssistantStore';

export type AssistantContext = {
  book?: BookAssistantContext | null;
  file?: ActiveFileContext | null;
};

export function buildContextPrompt(context: AssistantContext): string {
  const sections: string[] = [];

  if (context.book) {
    sections.push(
      `CURRENT BOOK\nTitle: ${context.book.title}\nFormat: ${context.book.format}\nContent:\n${context.book.text}`,
    );
  }

  if (context.file) {
    sections.push(`CURRENT FILE\n${context.file.promptContext}`);
  }

  if (!sections.length) return '';
  return [
    'Use the following local context as the primary source for context-specific questions.',
    'Do not claim facts that are not supported by the provided context.',
    'When the context is truncated, explicitly say that the unseen portion was not available.',
    sections.join('\n\n---\n\n'),
  ].join('\n\n');
}
