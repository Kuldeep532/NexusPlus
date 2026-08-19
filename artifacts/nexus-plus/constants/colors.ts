/**
 * Shared semantic design tokens for every mobile feature.
 * New feature screens should consume useColors() rather than hard-code theme
 * colors so light/dark appearance is inherited automatically.
 */
const colors = {
  light: {
    text: '#142025',
    tint: '#167A5A',
    background: '#F7FAF9',
    foreground: '#142025',
    card: '#FFFFFF',
    cardForeground: '#142025',
    primary: '#167A5A',
    primaryForeground: '#FFFFFF',
    secondary: '#E8F3EE',
    secondaryForeground: '#24563F',
    muted: '#EAF0ED',
    mutedForeground: '#66756F',
    accent: '#A36F00',
    accentForeground: '#FFFFFF',
    destructive: '#B42318',
    destructiveForeground: '#FFFFFF',
    border: '#D6E1DC',
    input: '#CCD9D3',
  },
  dark: {
    text: '#F2F6F7',
    tint: '#8FE3C1',
    background: '#0D151C',
    foreground: '#F2F6F7',
    card: '#17242C',
    cardForeground: '#F2F6F7',
    primary: '#8FE3C1',
    primaryForeground: '#0D151C',
    secondary: '#20343D',
    secondaryForeground: '#D9ECE7',
    muted: '#132129',
    mutedForeground: '#9FB1B8',
    accent: '#F1C75B',
    accentForeground: '#1A1B16',
    destructive: '#EF887B',
    destructiveForeground: '#0D151C',
    border: '#2D444E',
    input: '#2D444E',
  },
  radius: 12,
};
export default colors;
