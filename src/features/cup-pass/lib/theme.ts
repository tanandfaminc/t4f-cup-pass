/** T4F Cup Pass — shared design tokens (stadium dark theme) */

export const colors = {
  // Stadium dark palette
  pageBg: '#0a1628',            // deep midnight navy page background
  surface: '#111d33',           // card/section surfaces
  surfaceLight: '#182844',      // lighter card surfaces
  surfaceGlow: '#1a3050',       // hover/active surfaces

  // T4F brand blues
  primary: '#1a3a5c',           // deep navy
  primaryLight: '#2a5a8c',      // lighter navy
  primaryBg: '#0f2440',         // dark blue tint for backgrounds
  accent: '#5b8db8',            // mid blue accent

  // Electric highlights
  cyan: '#00d4ff',              // electric cyan for active states
  cyanDim: '#0099cc',           // dimmer cyan
  cyanGlow: 'rgba(0, 212, 255, 0.15)', // cyan glow bg

  // Scoring
  positive: '#22c55e',          // victory green for positive scores
  positiveDark: '#16a34a',      // darker green
  positiveBg: 'rgba(34, 197, 94, 0.12)',
  negative: '#ef4444',          // alert red for outs/strikeouts
  negativeDark: '#dc2626',
  negativeBg: 'rgba(239, 68, 68, 0.12)',
  neutral: '#64748b',           // slate gray for zero/neutral
  neutralBg: '#1e293b',         // dark slate for neutral buttons

  // Gold / rewards
  gold: '#f59e0b',              // warm gold for coins/rewards
  goldDim: '#d97706',
  goldBg: 'rgba(245, 158, 11, 0.12)',

  // UI text
  textPrimary: '#f1f5f9',       // bright white-ish
  textSecondary: '#94a3b8',     // slate-300 ish
  textMuted: '#64748b',         // slate-500
  white: '#ffffff',

  // Borders
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.12)',
  borderCyan: 'rgba(0, 212, 255, 0.3)',

  // Status
  warning: '#f97316',
  warningBg: 'rgba(249, 115, 22, 0.12)',
  info: '#38bdf8',
  infoBg: 'rgba(56, 189, 248, 0.1)',
} as const;

export const radius = {
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '18px',
} as const;

export const font = {
  xs: '0.65rem',
  sm: '0.75rem',
  base: '0.875rem',
  md: '0.95rem',
  lg: '1.1rem',
  xl: '1.35rem',
  xxl: '1.75rem',
  hero: '2.25rem',
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

/** Primary action button (dark theme) */
export const btnPrimary: React.CSSProperties = {
  ...btnBase,
  background: `linear-gradient(135deg, ${colors.primaryLight}, ${colors.primary})`,
  color: colors.white,
  padding: '0.875rem',
  fontSize: '1rem',
  border: `1px solid ${colors.borderLight}`,
};

/** Card container (dark theme) */
export const card: React.CSSProperties = {
  background: colors.surface,
  borderRadius: radius.lg,
  padding: '0.75rem 1rem',
  border: `1px solid ${colors.border}`,
};

/** T4F wordmark inline styles */
export const wordmark: React.CSSProperties = {
  fontSize: font.xs,
  fontWeight: 800,
  color: colors.cyan,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  margin: 0,
};

/** Stadium-themed page background */
export const stadiumPage: React.CSSProperties = {
  background: `linear-gradient(180deg, ${colors.pageBg} 0%, #0d1f3c 50%, #0a1628 100%)`,
  minHeight: '100dvh',
};

/** Branded header bar */
export const headerBar: React.CSSProperties = {
  background: `linear-gradient(135deg, #0d1f3c, ${colors.primary})`,
  borderBottom: `1px solid ${colors.borderCyan}`,
  padding: '0.5rem 0.75rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.4rem',
};
