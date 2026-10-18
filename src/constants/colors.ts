/**
 * SimplyNivo Design System - Premium Orange Palette
 * Transitioned from purple to Electric Neon Orange (#FF6B00)
 */

export const COLORS = {
  // Primary Palette
  primary: '#FF6B00',        // Electric Neon Orange
  primaryLight: '#FF8800',   // Light Accent Orange
  primaryDark: '#CC5200',    // Deep Shadow Orange
  accent: '#FF8800',         // Vibrant Orange Accent

  // Backgrounds
  background: '#0A0813',     // OLED Deep Dark Background
  cardBg: '#18121E',         // Dark Container Card Background
  cardBorder: '#2E2218',     // Subtle Orange-Tinted Border
  border: '#2E2218',

  // Typography
  textPrimary: '#FFFFFF',
  textSecondary: '#A09CAB',
  textMuted: '#686375',

  // States
  success: '#10B981',
  error: '#EF4444',

  // Gradients
  glowGradient: ['#FF6B00', '#FF8800', '#0A0813'] as const,
  buttonGradient: ['#FF7A00', '#FF5500', '#CC4400'] as const,
};

export const colors = {
  background: COLORS.background,
  primary: COLORS.primary,
  accent: COLORS.accent,
  cardBg: COLORS.cardBg,
  cardBorder: COLORS.cardBorder,
  border: COLORS.border,
  textPrimary: COLORS.textPrimary,
  textSecondary: COLORS.textSecondary,
  textMuted: COLORS.textMuted,
  success: COLORS.success,
  error: COLORS.error,
  primaryLight: COLORS.primaryLight,
  primaryDark: COLORS.primaryDark,
  glowGradient: COLORS.glowGradient,
  buttonGradient: COLORS.buttonGradient,
} as const;

export type ColorTheme = typeof colors;
export type ColorKey = keyof typeof colors;

export const Colors = colors;

export default colors;
