export type OemThemeFamily = 'android-dynamic' | 'samsung' | 'vivo' | 'xiaomi' | 'oppo' | 'realme' | 'oneplus' | 'generic';

export type LauncherThemeSignal = {
  family: OemThemeFamily;
  displayName: string;
  source: 'system' | 'launcher-heuristic';
  supportsDynamicColor: boolean;
  supportsThemedIcons: boolean;
  confidence: 'high' | 'medium' | 'low';
};

/**
 * OEM theme adapter registry. This intentionally does not call proprietary Theme Store APIs.
 * It describes supported integration strategies so the launcher can consume system-exposed
 * colors and device capabilities without network access or private SDK dependencies.
 */
export const OEM_THEME_ADAPTERS: readonly LauncherThemeSignal[] = [
  { family: 'android-dynamic', displayName: 'Android Dynamic Color', source: 'system', supportsDynamicColor: true, supportsThemedIcons: true, confidence: 'high' },
  { family: 'samsung', displayName: 'Samsung Galaxy Themes', source: 'launcher-heuristic', supportsDynamicColor: true, supportsThemedIcons: true, confidence: 'medium' },
  { family: 'vivo', displayName: 'vivo Themes', source: 'launcher-heuristic', supportsDynamicColor: true, supportsThemedIcons: false, confidence: 'medium' },
  { family: 'xiaomi', displayName: 'Xiaomi Themes', source: 'launcher-heuristic', supportsDynamicColor: true, supportsThemedIcons: true, confidence: 'medium' },
  { family: 'oppo', displayName: 'OPPO Themes', source: 'launcher-heuristic', supportsDynamicColor: true, supportsThemedIcons: true, confidence: 'medium' },
  { family: 'realme', displayName: 'realme Themes', source: 'launcher-heuristic', supportsDynamicColor: true, supportsThemedIcons: true, confidence: 'medium' },
  { family: 'oneplus', displayName: 'OnePlus system theming', source: 'launcher-heuristic', supportsDynamicColor: true, supportsThemedIcons: true, confidence: 'medium' },
  { family: 'generic', displayName: 'System theme', source: 'system', supportsDynamicColor: false, supportsThemedIcons: false, confidence: 'low' },
];

export function getThemeAdapterForManufacturer(manufacturer: string | null | undefined): LauncherThemeSignal {
  const value = (manufacturer ?? '').trim().toLowerCase();
  if (value.includes('samsung')) return OEM_THEME_ADAPTERS[1];
  if (value.includes('vivo') || value.includes('iqoo')) return OEM_THEME_ADAPTERS[2];
  if (value.includes('xiaomi') || value.includes('redmi') || value.includes('poco')) return OEM_THEME_ADAPTERS[3];
  if (value.includes('oppo')) return OEM_THEME_ADAPTERS[4];
  if (value.includes('realme')) return OEM_THEME_ADAPTERS[5];
  if (value.includes('oneplus')) return OEM_THEME_ADAPTERS[6];
  return OEM_THEME_ADAPTERS[0];
}
