import { getVisionScreenSnapshot, summarizeAccessibilitySnapshot } from './visionAssistNative';

export interface ScreenDescriptionResult {
  available: boolean;
  description: string;
  capturedAt?: number;
}

/** Stage 2 screen-description pipeline: accessibility semantics first, vision later. */
export async function describeCurrentScreen(): Promise<ScreenDescriptionResult> {
  const snapshot = await getVisionScreenSnapshot();
  if (!snapshot) {
    return {
      available: false,
      description: 'Nexus Vision Assist could not access the current screen. Enable its Android accessibility service and try again.',
    };
  }

  return {
    available: true,
    description: summarizeAccessibilitySnapshot(snapshot),
    capturedAt: snapshot.capturedAt,
  };
}
