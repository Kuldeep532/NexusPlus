/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#F2F6F7',
    tint: '#8FE3C1',

    // Core surfaces
    background: '#0D151C',
    foreground: '#F2F6F7',

    // Cards / elevated surfaces
    card: '#17242C',
    cardForeground: '#F2F6F7',

    // Primary action color (buttons, links, active states)
    primary: '#8FE3C1',
    primaryForeground: '#0D151C',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#20343D',
    secondaryForeground: '#D9ECE7',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#132129',
    mutedForeground: '#9FB1B8',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#F1C75B',
    accentForeground: '#1A1B16',

    // Destructive actions (delete, error states)
    destructive: '#EF887B',
    destructiveForeground: '#0D151C',

    // Borders and input outlines
    border: '#2D444E',
    input: '#2D444E',
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

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 8,
};

export default colors;
