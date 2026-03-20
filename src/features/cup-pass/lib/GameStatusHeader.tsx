import { colors, font } from './theme';

interface GameStatusHeaderProps {
  inningHalf: 'top' | 'bottom';
  inning: number;
  outs: number;
  /** Optional element rendered on the right (e.g. direction label for host, status dot for player) */
  rightContent?: React.ReactNode;
  /** Override/extend the strip container style (e.g. negative margins to counteract page padding) */
  style?: React.CSSProperties;
}

/**
 * Shared scorebug strip used by both the host and player game screens.
 * Visual reference: host game page design (badge + dot indicators).
 */
export default function GameStatusHeader({
  inningHalf,
  inning,
  outs,
  rightContent,
  style,
}: GameStatusHeaderProps) {
  return (
    <div style={{ ...s.strip, ...style }}>
      <div style={s.inningBadge}>
        <span style={s.inningHalfLabel}>{inningHalf === 'top' ? 'TOP' : 'BOT'}</span>
        <span style={s.inningNum}>{inning}</span>
      </div>
      <div style={s.outsBadge}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              ...s.outDot,
              background: i < outs ? colors.negative : 'rgba(255,255,255,0.2)',
              boxShadow: i < outs ? `0 0 6px ${colors.negative}` : 'none',
            }}
          />
        ))}
        <span style={s.outsLabel}>Outs</span>
      </div>
      {rightContent != null ? (
        <div>{rightContent}</div>
      ) : (
        <div style={{ minWidth: '5rem' }} />
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  strip: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: colors.surface, padding: '0.5rem 0.75rem',
    borderBottom: `1px solid ${colors.border}`,
  },
  inningBadge: { display: 'flex', alignItems: 'baseline', gap: '0.3rem' },
  inningHalfLabel: { fontSize: font.sm, fontWeight: 800, color: colors.white, textTransform: 'uppercase', letterSpacing: '0.06em' },
  inningNum: { fontSize: font.xl, fontWeight: 900, color: colors.white },
  outsBadge: { display: 'flex', alignItems: 'center', gap: '0.3rem' },
  outDot: { width: '0.7rem', height: '0.7rem', borderRadius: '50%', display: 'inline-block', transition: 'all 0.2s' },
  outsLabel: { fontSize: font.xs, fontWeight: 700, color: colors.textMuted, marginLeft: '0.15rem' },
};
