/** T4F Cup Pass — shared design tokens */

export const colors = {
  // T4F brand blues
  primary: '#1a3a5c',       // deep navy (headers, primary actions)
  primaryLight: '#2a5a8c',  // lighter navy
  primaryBg: '#e8eef5',     // light blue tint for backgrounds
  accent: '#5b8db8',        // mid blue accent

  // Scoring
  positive: '#1a7a3a',      // green for positive scores
  positiveBg: '#e6f4ea',
  negative: '#b71c1c',      // red for negative scores
  negativeBg: '#fce8e6',
  neutral: '#546e7a',       // gray for zero/neutral

  // UI
  surface: '#f7f8fa',       // card/section backgrounds
  surfaceDark: '#eef0f4',
  border: '#d8dde4',
  textPrimary: '#1a1a2e',
  textSecondary: '#5a6270',
  textMuted: '#8a919c',
  white: '#ffffff',

  // Status
  warning: '#e65100',
  warningBg: '#fff3e0',
  info: '#1a3a5c',
  infoBg: '#e8eef5',
} as const;

export const radius = {
  sm: '6px',
  md: '10px',
  lg: '14px',
} as const;

export const font = {
  xs: '0.65rem',
  sm: '0.75rem',
  base: '0.875rem',
  md: '0.95rem',
  lg: '1.1rem',
  xl: '1.35rem',
  xxl: '1.75rem',
} as const;

/** Reusable button base styles */
export const btnBase: React.CSSProperties = {
  fontFamily: 'inherit',
  fontWeight: 700,
  border: 'none',
  borderRadius: radius.md,
  cursor: 'pointer',
  textAlign: 'center',
};

/** Primary action button */
export const btnPrimary: React.CSSProperties = {
  ...btnBase,
  background: colors.primary,
  color: colors.white,
  padding: '0.875rem',
  fontSize: '1rem',
};

/** Card container */
export const card: React.CSSProperties = {
  background: colors.surface,
  borderRadius: radius.lg,
  padding: '0.75rem 1rem',
};

/** T4F wordmark inline styles */
export const wordmark: React.CSSProperties = {
  fontSize: font.xs,
  fontWeight: 800,
  color: colors.primary,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  margin: 0,
};
