import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../lib/gameContext';
import { rankPlayers } from '../lib/gameLogic';
import { track } from '../lib/analytics';
import { colors, font, radius, btnBase, wordmark } from '../lib/theme';

function scoreDisplay(score: number): string {
  return score > 0 ? `+${score}` : `${score}`;
}

export default function EndGamePage() {
  const navigate = useNavigate();
  const { state, actions } = useGame();
  const ranked = rankPlayers(state);
  const game = state.game!;
  const [copied, setCopied] = useState(false);

  const winner = ranked[0];

  async function handleRematch() {
    await actions.rematch();
    navigate('/game');
  }

  function handleNewGame() {
    actions.reset();
    navigate('/create');
  }

  const buildShareText = useCallback(() => {
    const lines = [
      `T4F Cup Pass — ${state.gameName || 'Game Over'}`,
      '',
      ...ranked.map((p, i) =>
        `${i === 0 ? '1st' : i === 1 ? '2nd' : i === 2 ? '3rd' : `${i + 1}th`} ${p.name}: ${scoreDisplay(p.score)}`
      ),
      '',
      `${game.history.length} plays over ${game.inning} inning${game.inning !== 1 ? 's' : ''}`,
    ];
    return lines.join('\n');
  }, [state.gameName, ranked, game.history.length, game.inning]);

  const handleShare = useCallback(() => {
    const text = buildShareText();
    if (navigator.share) {
      navigator.share({ title: 'T4F Cup Pass Results', text });
      track('share_clicked', { share_method: 'native' });
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
      track('share_clicked', { share_method: 'clipboard' });
    }
  }, [buildShareText]);

  return (
    <main style={s.page}>
      {/* Branded header */}
      <section style={s.headerCard}>
        <p style={wordmark}>T4F Cup Pass</p>
        <h1 style={s.title}>Game Over</h1>
        {state.gameName && <p style={s.gameName}>{state.gameName}</p>}
      </section>

      {/* Winner highlight */}
      {winner && (
        <section style={s.winnerCard}>
          <p style={s.winnerLabel}>Winner</p>
          <p style={s.winnerName}>{winner.name}</p>
          <p style={s.winnerScore}>{scoreDisplay(winner.score)}</p>
        </section>
      )}

      {/* Stats bar */}
      <div style={s.statsRow}>
        <div style={s.statBox}>
          <span style={s.statValue}>{game.history.length}</span>
          <span style={s.statLabel}>plays</span>
        </div>
        <div style={s.statBox}>
          <span style={s.statValue}>{game.inning}</span>
          <span style={s.statLabel}>inning{game.inning !== 1 ? 's' : ''}</span>
        </div>
        <div style={s.statBox}>
          <span style={s.statValue}>{ranked.length}</span>
          <span style={s.statLabel}>players</span>
        </div>
      </div>

      {/* Final standings */}
      <section style={s.standingsCard}>
        <p style={s.standingsTitle}>Final Standings</p>
        <ol style={s.list}>
          {ranked.map((p, i) => (
            <li key={p.id} style={{
              ...s.item,
              background: i === 0 ? '#fef9e7' : i % 2 === 0 ? colors.surface : colors.white,
              borderLeft: i === 0 ? `4px solid #e6a817` : '4px solid transparent',
            }}>
              <span style={s.rank}>{i === 0 ? '1st' : i === 1 ? '2nd' : i === 2 ? '3rd' : `${i + 1}th`}</span>
              <span style={s.name}>{p.name}</span>
              {p.seat && <span style={s.seat}>{p.seat}</span>}
              <span style={{ ...s.score, color: p.score > 0 ? colors.positive : p.score < 0 ? colors.negative : colors.textPrimary }}>
                {scoreDisplay(p.score)}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Share */}
      <button style={s.shareBtn} onClick={handleShare}>
        {copied ? 'Copied to clipboard!' : 'Share Results'}
      </button>

      {/* Actions */}
      <div style={s.actions}>
        <button style={s.rematchBtn} onClick={handleRematch}>
          Rematch — Same Players
        </button>
        <button style={s.newGameBtn} onClick={handleNewGame}>
          New Game
        </button>
      </div>
    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', padding: '1rem', gap: '0.75rem', minHeight: '100dvh' },

  headerCard: { textAlign: 'center', padding: '0.75rem 0 0.25rem' },
  title: { fontSize: '1.75rem', fontWeight: 800, margin: 0, color: colors.textPrimary },
  gameName: { fontSize: font.md, color: colors.textSecondary, margin: '0.15rem 0 0', fontWeight: 500 },

  winnerCard: { background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`, color: colors.white, borderRadius: radius.lg, padding: '1.25rem 1rem', textAlign: 'center' },
  winnerLabel: { fontSize: font.xs, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.85, margin: '0 0 0.2rem' },
  winnerName: { fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.1rem' },
  winnerScore: { fontSize: font.xl, fontWeight: 700, margin: 0, opacity: 0.9 },

  statsRow: { display: 'flex', justifyContent: 'center', gap: '1.5rem', padding: '0.25rem 0' },
  statBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.1rem' },
  statValue: { fontSize: font.lg, fontWeight: 800, color: colors.textPrimary },
  statLabel: { fontSize: font.xs, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' },

  standingsCard: { background: colors.surface, borderRadius: radius.lg, padding: '0.75rem', overflow: 'hidden' },
  standingsTitle: { fontSize: font.xs, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem', paddingLeft: '0.25rem' },
  list: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  item: { display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 0.75rem', borderRadius: radius.sm },
  rank: { fontSize: font.sm, fontWeight: 700, color: colors.textMuted, minWidth: '2rem' },
  name: { flex: 1, fontSize: font.md, fontWeight: 700, color: colors.textPrimary },
  seat: { fontSize: font.sm, color: colors.textMuted },
  score: { fontSize: font.lg, fontWeight: 700 },

  shareBtn: { ...btnBase, padding: '0.75rem', fontSize: font.md, background: colors.primaryBg, color: colors.primary, border: `2px solid ${colors.primary}`, borderRadius: radius.md },

  actions: { marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.25rem' },
  rematchBtn: { ...btnBase, padding: '0.875rem', fontSize: '1rem', background: colors.positive, color: colors.white, borderRadius: radius.md },
  newGameBtn: { ...btnBase, padding: '0.75rem', fontSize: font.md, background: 'none', border: `2px solid ${colors.primary}`, color: colors.primary, borderRadius: radius.md },
};
