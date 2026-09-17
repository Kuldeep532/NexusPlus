import { NativeModules, Platform } from 'react-native';

export interface AccessibilityNodeSnapshot {
  text?: string;
  contentDescription?: string;
  className?: string;
  packageName?: string;
  viewId?: string;
  bounds?: { left: number; top: number; right: number; bottom: number };
  clickable: boolean;
  enabled: boolean;
  editable: boolean;
  focused: boolean;
  scrollable: boolean;
  children: AccessibilityNodeSnapshot[];
}

export interface VisionScreenSnapshot {
  packageName?: string;
  windowTitle?: string;
  nodes: AccessibilityNodeSnapshot[];
  capturedAt: number;
}

interface VisionAssistNativeModule {
  isAccessibilityServiceEnabled(): Promise<boolean>;
  getCurrentAccessibilitySnapshot(): Promise<VisionScreenSnapshot | null>;
  requestAccessibilitySettings(): Promise<void>;
}

const nativeModule = NativeModules.NexusVisionAssist as VisionAssistNativeModule | undefined;

export async function isVisionAccessibilityEnabled(): Promise<boolean> {
  if (Platform.OS !== 'android' || !nativeModule) return false;
  return nativeModule.isAccessibilityServiceEnabled();
}

export async function getVisionScreenSnapshot(): Promise<VisionScreenSnapshot | null> {
  if (Platform.OS !== 'android' || !nativeModule) return null;
  return nativeModule.getCurrentAccessibilitySnapshot();
}

export async function openVisionAccessibilitySettings(): Promise<void> {
  if (Platform.OS !== 'android' || !nativeModule) return;
  await nativeModule.requestAccessibilitySettings();
}

export function summarizeAccessibilitySnapshot(snapshot: VisionScreenSnapshot): string {
  const lines: string[] = [];
  if (snapshot.packageName) lines.push(`App: ${snapshot.packageName}`);
  if (snapshot.windowTitle) lines.push(`Window: ${snapshot.windowTitle}`);

  const walk = (node: AccessibilityNodeSnapshot, depth: number) => {
    const label = (node.text || node.contentDescription || '').trim();
    if (label) {
      const role = node.className?.split('.').pop() || 'control';
      const state = [node.clickable ? 'clickable' : '', node.editable ? 'editable' : '', node.focused ? 'focused' : '', node.enabled ? '' : 'disabled']
        .filter(Boolean).join(', ');
      lines.push(`${'  '.repeat(Math.min(depth, 4))}${role}: ${label}${state ? ` (${state})` : ''}`);
    }
    node.children.forEach((child) => walk(child, depth + 1));
  };
  snapshot.nodes.forEach((node) => walk(node, 0));
  return lines.length ? lines.join('\n') : 'No readable accessibility content was exposed by the current app.';
}
