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
    text: '#F4F7FA',
    tint: '#55E6C1',

    // Core surfaces
    background: '#08131B',
    foreground: '#F4F7FA',

    // Cards / elevated surfaces
    card: '#10232C',
    cardForeground: '#F4F7FA',

    // Primary action color (buttons, links, active states)
    primary: '#55E6C1',
    primaryForeground: '#08131B',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#17333C',
    secondaryForeground: '#D8F6EE',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#142A33',
    mutedForeground: '#8CA7AF',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#5B5DE6',
    accentForeground: '#F4F7FA',

    // Destructive actions (delete, error states)
    destructive: '#F07A6A',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#20424B',
    input: '#20424B',
  },
  dark: {
    text: '#F4F7FA',
    tint: '#55E6C1',
    background: '#08131B',
    foreground: '#F4F7FA',
    card: '#10232C',
    cardForeground: '#F4F7FA',
    primary: '#55E6C1',
    primaryForeground: '#08131B',
    secondary: '#17333C',
    secondaryForeground: '#D8F6EE',
    muted: '#142A33',
    mutedForeground: '#8CA7AF',
    accent: '#5B5DE6',
    accentForeground: '#F4F7FA',
    destructive: '#F07A6A',
    destructiveForeground: '#FFFFFF',
    border: '#20424B',
    input: '#20424B',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 8,
};

export default colors;
