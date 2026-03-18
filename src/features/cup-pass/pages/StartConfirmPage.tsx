import { useNavigate } from 'react-router-dom';
import { useGame } from '../lib/gameContext';
import { colors, font, radius, btnBase, wordmark } from '../lib/theme';

export default function StartConfirmPage() {
  const navigate = useNavigate();
  const { state, actions, backendStatus } = useGame();

  async function handleStart() {
    await actions.startGame();
    navigate('/game');
  }

  const isSaving = backendStatus === 'saving';
  const firstPlayer = state.players[0];

  return (
    <main style={s.page}>
      <div style={s.top}>
        <p style={wordmark}>T4F Cup Pass</p>
        <h1 style={s.title}>Ready to Play?</h1>
        {state.gameName && (
          <p style={s.meta}>{state.gameName}{state.teamName ? ` · ${state.teamName}` : ''}</p>
        )}
      </div>

      {state.publicCode && (
        <div style={s.codeBadge}>
          <span style={s.codeLabel}>Game code</span>
          <span style={s.codeValue}>{state.publicCode}</span>
        </div>
      )}

      {/* Cup order */}
      <section style={s.card}>
        <p style={s.cardLabel}>Cup passing order · {state.players.length} players</p>
        <ol style={s.list}>
          {state.players.map((p, i) => (
            <li key={p.id} style={{
              ...s.item,
              background: i === 0 ? colors.primaryBg : 'transparent',
              borderLeft: i === 0 ? `3px solid ${colors.primary}` : '3px solid transparent',
            }}>
              <span style={{ ...s.playerName, color: i === 0 ? colors.primary : colors.textPrimary }}>
                {p.name}
                {i === 0 && <span style={s.firstBadge}> starts with cup</span>}
              </span>
              {p.seat && <span style={s.seat}>Seat {p.seat}</span>}
            </li>
          ))}
        </ol>
      </section>

      {/* Game rules summary */}
      <section style={s.card}>
        <p style={s.cardLabel}>Game rules</p>
        <div style={s.rulesList}>
          <p style={s.rule}>Direction reverses each inning</p>
          <p style={s.rule}>{firstPlayer?.name || 'Player 1'} starts with the cup</p>
          <p style={s.rule}>Cup passes left to start</p>
        </div>
      </section>

      <div style={s.bottom}>
        <button
          style={{ ...s.startBtn, opacity: isSaving ? 0.6 : 1 }}
          onClick={handleStart}
          disabled={isSaving}
        >
          {isSaving ? 'Starting...' : '⚾ Start Game'}
        </button>
        <button style={s.backBtn} onClick={() => navigate('/seat-order')}>
          ← Back to Seat Order
        </button>
      </div>
    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', padding: '1.25rem', gap: '0.75rem', minHeight: '100dvh' },
  top: { display: 'flex', flexDirection: 'column', gap: '0.3rem', paddingTop: '0.5rem' },
  title: { fontSize: '1.5rem', fontWeight: 800, color: colors.textPrimary, margin: 0 },
  meta: { fontSize: font.md, color: colors.textSecondary, margin: 0 },

  codeBadge: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
    background: colors.primaryBg, borderRadius: radius.md, padding: '0.5rem 0.75rem',
  },
  codeLabel: { fontSize: font.sm, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' },
  codeValue: { fontSize: font.lg, fontWeight: 800, color: colors.primary, letterSpacing: '0.1em' },

  card: { background: colors.surface, borderRadius: radius.lg, padding: '0.75rem 1rem' },
  cardLabel: { fontSize: font.xs, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem' },
  list: { margin: 0, padding: '0 0 0 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  item: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: font.md, padding: '0.35rem 0.5rem', borderRadius: radius.sm },
  playerName: { fontWeight: 700 },
  firstBadge: { fontSize: font.xs, fontWeight: 500, color: colors.textMuted, fontStyle: 'italic' },
  seat: { fontSize: font.sm, color: colors.textMuted },

  rulesList: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  rule: { fontSize: font.base, color: colors.textSecondary, margin: 0, paddingLeft: '0.25rem' },

  bottom: { marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingTop: '0.5rem' },
  startBtn: { ...btnBase, padding: '0.875rem', fontSize: font.lg, background: colors.positive, color: colors.white, borderRadius: radius.md },
  backBtn: { ...btnBase, padding: '0.5rem', fontSize: font.base, background: 'none', color: colors.primary, borderRadius: radius.sm },
};
