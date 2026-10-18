/**
 * SimplyNivo Design System - Color Palette
 * Dark OLED theme tokens with neon violet and light purple accents
 */

export const colors = {
  background: '#0A0813', // Deep dark OLED background
  primary: '#9B51E0',    // Neon violet glow
  accent: '#C07DF1',     // Light purple highlighting
  cardBg: '#161226',     // Glassmorphic dark container background
  textPrimary: '#FFFFFF',
  textSecondary: '#A09CAB',
  border: '#2E274C',
} as const;

export type ColorTheme = typeof colors;
export type ColorKey = keyof typeof colors;

export const Colors = colors;

export default colors;
