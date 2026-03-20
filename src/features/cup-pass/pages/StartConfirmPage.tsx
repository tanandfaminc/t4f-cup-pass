import { useNavigate } from 'react-router-dom';
import { useGame } from '../lib/gameContext';
import { getMode } from '../lib/modes';
import { colors, font, radius, btnBase, headerBar } from '../lib/theme';

const MODE_ICONS: Record<string, string> = {
  cup_pass: '⚾',
  cup_classic: '🪙',
};

export default function StartConfirmPage() {
  const navigate = useNavigate();
  const { state, actions, backendStatus } = useGame();
  const mode = getMode(state.mode);

  async function handleStart() {
    await actions.startGame();
    navigate('/game');
  }

  const isSaving = backendStatus === 'saving';
  const firstPlayer = state.players[0];

  return (
    <main style={s.page}>
      <header style={headerBar}>
        <button style={s.navBack} onClick={() => navigate('/seat-order')}>‹</button>
        <span style={s.headerTitle}>Ready to Play?</span>
      </header>

      <div style={s.content}>
        {state.gameName && <p style={s.meta}>{state.gameName}</p>}

        {state.publicCode && (
          <div style={s.codeBadge}>
            <span style={s.codeLabel}>Game code</span>
            <span style={s.codeValue}>{state.publicCode}</span>
          </div>
        )}

        {/* Mode description */}
        <section style={s.modeCard}>
          <div style={s.modeHeader}>
            <span style={s.modeIcon}>{MODE_ICONS[mode.id] ?? '🎮'}</span>
            <span style={s.modeName}>{mode.name}</span>
          </div>
          <p style={s.modeDesc}>{mode.description}</p>
          {mode.id === 'cup_classic' && (
            <p style={s.modeExtra}>Each player starts with {mode.startingScore} {mode.scoreUnitPlural}.</p>
          )}
        </section>

        {/* Cup order */}
        <section style={s.card}>
          <p style={s.cardLabel}>Cup passing order · {state.players.length} players</p>
          <ol style={s.list}>
            {state.players.map((p, i) => (
              <li key={p.id} style={{
                ...s.item,
                background: i === 0 ? 'rgba(0, 212, 255, 0.08)' : 'transparent',
                borderLeft: i === 0 ? `3px solid ${colors.cyan}` : '3px solid transparent',
              }}>
                <span style={{ ...s.playerName, color: i === 0 ? colors.cyan : colors.textPrimary }}>
                  {p.name}
                  {i === 0 && <span style={s.firstBadge}> starts with cup</span>}
                </span>
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
            {mode.id === 'cup_classic' && (
              <p style={s.rule}>Score tracked as {mode.scoreUnitPlural} — highest total wins</p>
            )}
          </div>
        </section>

        <div style={s.bottom}>
          <button
            style={{ ...s.startBtn, opacity: isSaving ? 0.6 : 1 }}
            onClick={handleStart}
            disabled={isSaving}
          >
            {isSaving ? 'Starting...' : `${MODE_ICONS[mode.id] ?? '⚾'} Start Game`}
          </button>
          <button style={s.backBtn} onClick={() => navigate('/seat-order')}>
            ← Back to Seat Order
          </button>
        </div>
      </div>
    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex', flexDirection: 'column', minHeight: '100dvh',
    background: `linear-gradient(180deg, #0a1628 0%, #0f2a4a 40%, #0a1628 100%)`,
  },
  navBack: {
    ...btnBase, fontSize: '1.5rem', padding: '0.25rem 0.5rem', background: 'none',
    color: colors.textSecondary, lineHeight: 1, position: 'absolute', left: '0.5rem',
  },
  headerTitle: { fontSize: font.md, fontWeight: 800, color: colors.white, textTransform: 'uppercase', letterSpacing: '0.06em' },
  content: { display: 'flex', flexDirection: 'column', padding: '1.25rem', gap: '0.75rem', flex: 1 },
  meta: { fontSize: font.md, color: colors.textSecondary, margin: 0, textAlign: 'center' },

  codeBadge: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
    background: colors.surface, borderRadius: radius.md, padding: '0.5rem 0.75rem',
    border: `1px solid ${colors.borderCyan}`,
  },
  codeLabel: { fontSize: font.sm, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' },
  codeValue: { fontSize: font.lg, fontWeight: 800, color: colors.cyan, letterSpacing: '0.1em' },

  modeCard: {
    background: colors.goldBg, border: `1.5px solid rgba(245, 158, 11, 0.25)`,
    borderRadius: radius.lg, padding: '0.75rem 1rem',
  },
  modeHeader: { display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' },
  modeIcon: { fontSize: '1.1rem' },
  modeName: { fontSize: font.md, fontWeight: 700, color: colors.gold },
  modeDesc: { fontSize: font.sm, color: colors.textSecondary, margin: 0, lineHeight: 1.4 },
  modeExtra: { fontSize: font.sm, color: colors.textSecondary, margin: '0.3rem 0 0', fontWeight: 600 },

  card: { background: colors.surface, borderRadius: radius.lg, padding: '0.75rem 1rem', border: `1px solid ${colors.border}` },
  cardLabel: { fontSize: font.xs, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem' },
  list: { margin: 0, padding: '0 0 0 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  item: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: font.md, padding: '0.35rem 0.5rem', borderRadius: radius.sm },
  playerName: { fontWeight: 700 },
  firstBadge: { fontSize: font.xs, fontWeight: 500, color: colors.textMuted, fontStyle: 'italic' },

  rulesList: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  rule: { fontSize: font.base, color: colors.textSecondary, margin: 0, paddingLeft: '0.25rem' },

  bottom: { marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingTop: '0.5rem' },
  startBtn: {
    ...btnBase, padding: '0.875rem', fontSize: font.lg,
    background: `linear-gradient(135deg, ${colors.positive}, ${colors.positiveDark})`,
    color: colors.white, borderRadius: radius.md,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  },
  backBtn: { ...btnBase, padding: '0.5rem', fontSize: font.base, background: 'none', color: colors.textSecondary, borderRadius: radius.sm },
};
