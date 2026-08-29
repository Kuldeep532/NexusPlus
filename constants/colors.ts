/**
 * Semantic design tokens shared by the entire mobile app.
 * Screens consume useColors() and never need to define feature-specific
 * colors. The selected palette supplies the same token set everywhere.
 */
export const palettes = {
  oceanBlue: {
    light: { text: '#102A43', tint: '#087EA4', background: '#F4FAFC', foreground: '#102A43', card: '#FFFFFF', cardForeground: '#102A43', primary: '#087EA4', primaryForeground: '#FFFFFF', secondary: '#DDF3FA', secondaryForeground: '#075A75', muted: '#E8F1F5', mutedForeground: '#5D7180', accent: '#C28A2C', accentForeground: '#FFFFFF', destructive: '#B42318', destructiveForeground: '#FFFFFF', border: '#C9DEE7', input: '#BDD4DE' },
    dark: { text: '#E8F7FC', tint: '#58C7E8', background: '#071820', foreground: '#E8F7FC', card: '#102832', cardForeground: '#E8F7FC', primary: '#58C7E8', primaryForeground: '#06202A', secondary: '#153C49', secondaryForeground: '#D5F3FA', muted: '#102C36', mutedForeground: '#9AB7C2', accent: '#E0B24D', accentForeground: '#211705', destructive: '#F08A7E', destructiveForeground: '#1B0907', border: '#25505F', input: '#25505F' },
  },
  classic: {
    light: { text: '#142025', tint: '#167A5A', background: '#F7FAF9', foreground: '#142025', card: '#FFFFFF', cardForeground: '#142025', primary: '#167A5A', primaryForeground: '#FFFFFF', secondary: '#E8F3EE', secondaryForeground: '#24563F', muted: '#EAF0ED', mutedForeground: '#66756F', accent: '#A36F00', accentForeground: '#FFFFFF', destructive: '#B42318', destructiveForeground: '#FFFFFF', border: '#D6E1DC', input: '#CCD9D3' },
    dark: { text: '#F2F6F7', tint: '#8FE3C1', background: '#0D151C', foreground: '#F2F6F7', card: '#17242C', cardForeground: '#F2F6F7', primary: '#8FE3C1', primaryForeground: '#0D151C', secondary: '#20343D', secondaryForeground: '#D9ECE7', muted: '#132129', mutedForeground: '#9FB1B8', accent: '#F1C75B', accentForeground: '#1A1B16', destructive: '#EF887B', destructiveForeground: '#0D151C', border: '#2D444E', input: '#2D444E' },
  },
  light: {
    light: { text: '#111827', tint: '#2563EB', background: '#F8FAFC', foreground: '#111827', card: '#FFFFFF', cardForeground: '#111827', primary: '#2563EB', primaryForeground: '#FFFFFF', secondary: '#E8EEF9', secondaryForeground: '#1E3A8A', muted: '#EEF2F7', mutedForeground: '#64748B', accent: '#B7791F', accentForeground: '#FFFFFF', destructive: '#DC2626', destructiveForeground: '#FFFFFF', border: '#D8E0EA', input: '#CBD5E1' },
    dark: { text: '#F8FAFC', tint: '#93C5FD', background: '#0F172A', foreground: '#F8FAFC', card: '#1E293B', cardForeground: '#F8FAFC', primary: '#93C5FD', primaryForeground: '#0F172A', secondary: '#24324A', secondaryForeground: '#DBEAFE', muted: '#182337', mutedForeground: '#94A3B8', accent: '#F2C35B', accentForeground: '#171109', destructive: '#F87171', destructiveForeground: '#1F0A0A', border: '#334155', input: '#334155' },
  },
} as const;

export type ColorTokens = (typeof palettes.oceanBlue.light);
export const radius = 12;
export default { light: palettes.oceanBlue.light, dark: palettes.oceanBlue.dark, radius };
