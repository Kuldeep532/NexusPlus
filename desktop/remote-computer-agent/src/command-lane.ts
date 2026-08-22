import type { DynamicCommand } from './dynamic-command';

export interface CommandContext {
  activeApp?: string;
  platform: NodeJS.Platform;
}

export interface CommandResult { ok: boolean; message: string; }

export interface AppCommandAdapter {
  readonly id: string;
  canHandle(command: DynamicCommand, context: CommandContext): boolean;
  execute(command: DynamicCommand, context: CommandContext): Promise<CommandResult>;
}

/**
 * Application integrations plug into this lane. Android only sends natural
 * language; it does not contain Zoom/WhatsApp/YouTube-specific command codes.
 * Adapters should use official app APIs or accessibility automation, not
 * arbitrary shell execution.
 */
export class CommandLane {
  private readonly adapters: AppCommandAdapter[] = [];

  register(adapter: AppCommandAdapter): void { this.adapters.push(adapter); }

  async execute(command: DynamicCommand, context: CommandContext): Promise<CommandResult> {
    for (const adapter of this.adapters) {
      if (adapter.canHandle(command, context)) return adapter.execute(command, context);
    }
    return { ok: false, message: 'No authorized application adapter can handle this command.' };
  }
}
