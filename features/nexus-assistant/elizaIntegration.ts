import { nexusMusicPlugin } from './elizaMusicPlugin';

/**
 * Thin ElizaOS integration boundary.
 *
 * The mobile app keeps execution in its existing Android-safe planner/executor.
 * ElizaOS contributes the plugin contract and action semantics without owning the
 * playback engine or bundling a second media runtime.
 */
export function getNexusElizaPlugins() {
  return [nexusMusicPlugin] as const;
}
