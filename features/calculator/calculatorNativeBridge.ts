import { NativeModules, Platform } from 'react-native';

type NativeCalculator = {
  evaluateExpression?: (expression: string) => number;
};

/**
 * Optional native fast path. The JS engine remains the compatibility fallback,
 * so the calculator does not depend on a native module being present.
 */
export function getNativeCalculator(): NativeCalculator | null {
  if (Platform.OS === 'web') return null;
  return (NativeModules.NexusCalculator as NativeCalculator | undefined) ?? null;
}
