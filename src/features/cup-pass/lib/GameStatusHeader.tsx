import { colors } from './theme';

interface GameStatusHeaderProps {
  inningHalf: 'top' | 'bottom';
  inning: number;
  outs: number;
  gameName?: string;
  /** Optional element rendered on the right (e.g. status dot for players) */
  rightContent?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Shared top game status header used by both the host and player game screens.
 * Displays inning, outs, and game name in a compact inline row.
 */
export default function GameStatusHeader({
  inningHalf,
  inning,
  outs,
  gameName,
  rightContent,
  style,
}: GameStatusHeaderProps) {
  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...style }}>
      <div>
        <span style={s.inning}>{inningHalf === 'top' ? 'Top' : 'Bottom'} {inning}</span>
        <span style={s.outs}> · {outs}/3 outs</span>
        {gameName && <span style={s.gameName}> — {gameName}</span>}
      </div>
      {rightContent}
    </header>
  );
}

const s: Record<string, React.CSSProperties> = {
  inning: { fontSize: '0.9rem', fontWeight: 700, color: colors.white },
  outs: { fontSize: '0.8rem', fontWeight: 600, color: colors.negative },
  gameName: { fontSize: '0.8rem', color: colors.textMuted },
};
