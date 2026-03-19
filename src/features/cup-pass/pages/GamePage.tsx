import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../lib/gameContext';
import { rankPlayers, playsInCurrentHalf } from '../lib/gameLogic';
import { getMode } from '../lib/modes';
import { track } from '../lib/analytics';
import { colors, font, radius, btnBase, wordmark } from '../lib/theme';
import type { HitEvent } from '../types';

const EVENTS: Array<{ event: HitEvent; label: string; delta: number }> = [
  { event: 'home_run',    label: 'Home Run', delta: 4 },
  { event: 'triple',      label: 'Triple',   delta: 3 },
  { event: 'double',      label: 'Double',   delta: 2 },
  { event: 'single',      label: 'Single',   delta: 1 },
  { event: 'walk',        label: 'Walk',     delta: 1 },
  { event: 'hit_by_pitch',label: 'HBP',      delta: 1 },
  { event: 'sacrifice',   label: 'Sac',      delta: 0 },
  { event: 'error',       label: 'Error',    delta: 0 },
  { event: 'out',         label: 'Out',      delta: -1 },
  { event: 'strikeout',   label: 'K',        delta: -2 },
];

const EVENT_LABELS: Record<string, string> = {
  home_run: 'Home Run', triple: 'Triple', double: 'Double', single: 'Single',
  walk: 'Walk', hit_by_pitch: 'HBP', sacrifice: 'Sac', error: 'Error',
  out: 'Out', strikeout: 'K',
};

function eventColor(delta: number): string {
  if (delta > 0) return colors.positive;
  if (delta < 0) return colors.negative;
  return colors.neutral;
}

function scoreDisplay(score: number): string {
  return score > 0 ? `+${score}` : `${score}`;
}

export default function GamePage() {
  const navigate = useNavigate();
  const { state, actions } = useGame();
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(() => {
    if (!state.publicCode) return;
    const url = `${window.location.origin}/join/${state.publicCode}`;
    const text = `Join my Cup Pass game!\nCode: ${state.publicCode}`;
    if (navigator.share) {
      navigator.share({ title: state.gameName || 'T4F Cup Pass', text, url });
      track('share_clicked', { share_method: 'native', game_code: state.publicCode });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
      track('share_clicked', { share_method: 'clipboard', game_code: state.publicCode });
    }
  }, [state.publicCode, state.gameName]);

  const game = state.game!;
  const { players } = state;
  const currentPlayer = players[game.currentPlayerIndex];
  const dirStep = game.rotationDirection === 'left' ? 1 : -1;
  const nextPlayer = players[(game.currentPlayerIndex + dirStep + players.length) % players.length];
  const ranked = rankPlayers(state);
  const isPaused = game.isPaused;
  const dirLabel = game.rotationDirection === 'left' ? '← Passing left' : 'Passing right →';
  const mode = getMode(state.mode);

  function log(event: HitEvent) {
    actions.logEvent(event);
  }

  async function handleEnd() {
    if (!window.confirm('End the game now?')) return;
    await actions.endGame();
    navigate('/end');
  }

  function handlePrevInning() {
    // Can't go back from Top 1
    if (game.inning <= 1 && game.inningHalf === 'top') return;
    const playsThisHalf = playsInCurrentHalf(game);
    if (playsThisHalf > 0) {
      const halfLabel = `${game.inningHalf === 'top' ? 'Top' : 'Bottom'} ${game.inning}`;
      window.alert(
        `${playsThisHalf} play${playsThisHalf > 1 ? 's have' : ' has'} already been logged in ${halfLabel}.\n\nPlease undo those plays first using "Undo Last", then go back.`,
      );
      return;
    }
    actions.prevInning();
  }

  // Build player name lookup for history
  const playerNames: Record<string, string> = {};
  for (const p of players) playerNames[p.id] = p.name;

  return (
    <main style={s.page}>
      {/* T4F Wordmark + Game Name */}
      <header style={s.topBar}>
        <p style={wordmark}>T4F Cup Pass</p>
        {state.gameName && <span style={s.gameName}>{state.gameName}</span>}
      </header>

      {/* Inning + Direction strip */}
      <div style={s.inningStrip}>
        <div style={s.inningBadge}>
          <span style={s.inningHalfLabel}>{game.inningHalf === 'top' ? 'Top' : 'Bottom'}</span>
          <span style={s.inningNum}>{game.inning}</span>
        </div>
        <span style={s.dirLabel}>{dirLabel}</span>
        <div style={s.playsCount}>{game.history.length} plays</div>
      </div>

      {/* Game controls */}
      <div style={s.controlRow}>
        <button style={s.controlBtn} onClick={() => actions.nextInning()}>
          {game.inningHalf === 'top'
            ? `↓ Bottom ${game.inning}`
            : `↑ Top ${game.inning + 1}`}
        </button>
        <button
          style={{
            ...s.controlBtn,
            background: isPaused ? colors.warning : colors.surfaceDark,
            color: isPaused ? colors.white : colors.textPrimary,
          }}
          onClick={() => isPaused ? actions.resume() : actions.pause()}
        >
          {isPaused ? '▶ Resume' : '⏸ Pause'}
        </button>
        {state.publicCode && (
          <button style={s.shareBtn} onClick={handleShare}>
            {copied ? 'Copied!' : `Share: ${state.publicCode}`}
          </button>
        )}
      </div>

      {/* Prev-half revert control — host only, shown when not at Top 1 */}
      {(game.inning > 1 || game.inningHalf === 'bottom') && (
        <div style={s.prevHalfRow}>
          <button style={s.prevHalfBtn} onClick={handlePrevInning}>
            ← Prev Half
          </button>
          <span style={s.prevHalfHint}>
            {game.inningHalf === 'top'
              ? `Back to Bottom ${game.inning - 1}`
              : `Back to Top ${game.inning}`}
          </span>
        </div>
      )}

      {/* Pause overlay */}
      {isPaused && (
        <section style={s.pauseBanner}>
          <p style={s.pauseText}>Game Paused</p>
          <button style={s.resumeBtn} onClick={() => actions.resume()}>
            ▶ Resume Game
          </button>
        </section>
      )}

      {/* Current cup holder — large & prominent */}
      <section style={{ ...s.cupHolder, opacity: isPaused ? 0.5 : 1 }}>
        <p style={s.cupLabel}>Cup is with</p>
        <p style={s.cupName}>{currentPlayer.name}</p>
        {currentPlayer.seat && <p style={s.cupSeat}>Seat {currentPlayer.seat}</p>}
        <p style={s.cupScore}>
          {mode.id === 'cup_classic' ? '🪙 ' : ''}{scoreDisplay(game.scores[currentPlayer.id])} {mode.scoreUnitPlural}
        </p>
      </section>

      {/* Next up indicator */}
      {!isPaused && (
        <div style={s.nextUpRow}>
          <span style={s.nextUpArrow}>{game.rotationDirection === 'left' ? '←' : '→'}</span>
          <span style={s.nextUpLabel}>Next up</span>
          <span style={s.nextUpName}>{nextPlayer.name}</span>
          {nextPlayer.seat && <span style={s.nextUpSeat}>{nextPlayer.seat}</span>}
        </div>
      )}

      {/* Event buttons */}
      <section style={s.eventGrid}>
        {EVENTS.map(({ event, label, delta }) => (
          <button
            key={event}
            style={{ ...s.eventBtn, background: eventColor(delta), opacity: isPaused ? 0.4 : 1 }}
            onClick={() => log(event)}
            disabled={isPaused}
          >
            <span style={s.eventLabel}>{label}</span>
            <span style={s.eventDelta}>{delta > 0 ? `+${delta}` : delta === 0 ? '0' : delta}</span>
          </button>
        ))}
      </section>

      {/* Undo + History */}
      <div style={s.undoRow}>
        <button
          style={{ ...s.undoBtn, opacity: game.history.length === 0 ? 0.3 : 1 }}
          onClick={() => actions.undo()}
          disabled={game.history.length === 0}
        >
          ↩ Undo Last
        </button>
        <button
          style={s.historyToggle}
          onClick={() => setShowHistory(!showHistory)}
        >
          {showHistory ? 'Hide History' : `History (${game.history.length})`}
        </button>
      </div>

      {/* Event history drawer */}
      {showHistory && (
        <section style={s.historyPanel}>
          {game.history.length === 0 ? (
            <p style={s.historyEmpty}>No events yet.</p>
          ) : (
            [...game.history].reverse().map((ev, i) => (
              <div key={game.history.length - 1 - i} style={s.historyRow}>
                <span style={s.historyInning}>{ev.inningHalf === 'top' ? 'T' : 'B'}{ev.inning}</span>
                <span style={s.historyName}>{playerNames[ev.playerId]}</span>
                <span style={{ ...s.historyEvent, color: eventColor(ev.delta) }}>
                  {EVENT_LABELS[ev.event] || ev.event}
                </span>
                <span style={{ ...s.historyDelta, color: eventColor(ev.delta) }}>
                  {ev.delta > 0 ? `+${ev.delta}` : ev.delta}
                </span>
              </div>
            ))
          )}
        </section>
      )}

      {/* Mini scoreboard */}
      <section style={s.scoreboard}>
        <p style={s.scoreboardTitle}>
          {mode.id === 'cup_classic' ? '🪙 Coin Totals' : 'Scoreboard'}
        </p>
        {ranked.map((p, i) => {
          const isCurrent = p.id === currentPlayer.id;
          const isNext = p.id === nextPlayer.id;
          return (
            <div key={p.id} style={{
              ...s.scoreRow,
              background: isCurrent ? colors.primaryBg : isNext ? '#f0f4f8' : 'transparent',
              border: isCurrent ? `2px solid ${colors.primary}` : '2px solid transparent',
            }}>
              <span style={s.scoreRank}>{i + 1}</span>
              <span style={{ ...s.scoreName, color: isCurrent ? colors.primary : colors.textPrimary }}>
                {p.name}
                {isCurrent && <span style={s.cupBadge}> ⚾</span>}
                {isNext && <span style={s.nextBadge}> next</span>}
              </span>
              {p.seat && <span style={s.scoreSeat}>{p.seat}</span>}
              <span style={{ ...s.scoreVal, color: p.score > 0 ? colors.positive : p.score < 0 ? colors.negative : colors.textPrimary }}>
                {scoreDisplay(p.score)}
              </span>
            </div>
          );
        })}
      </section>

      <button style={s.endBtn} onClick={handleEnd}>End Game</button>
    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', padding: '0.75rem', gap: '0.6rem', minHeight: '100dvh', paddingBottom: '1.5rem' },

  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.15rem 0' },
  gameName: { fontSize: font.sm, color: colors.textMuted, fontWeight: 500 },

  inningStrip: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: colors.primaryBg, borderRadius: radius.md, padding: '0.5rem 0.75rem',
  },
  inningBadge: { display: 'flex', alignItems: 'baseline', gap: '0.3rem' },
  inningHalfLabel: { fontSize: font.sm, fontWeight: 700, color: colors.primary, textTransform: 'uppercase', letterSpacing: '0.05em' },
  inningLabel: { fontSize: font.xs, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' },
  inningNum: { fontSize: font.lg, fontWeight: 800, color: colors.primary },
  dirLabel: { fontSize: font.sm, fontWeight: 700, color: colors.primaryLight },
  playsCount: { fontSize: font.xs, fontWeight: 600, color: colors.textMuted },

  controlRow: { display: 'flex', gap: '0.35rem', flexWrap: 'wrap' },
  controlBtn: {
    ...btnBase, fontSize: font.sm, padding: '0.35rem 0.6rem',
    background: colors.surfaceDark, color: colors.textPrimary, borderRadius: radius.sm,
  },
  shareBtn: {
    ...btnBase, fontSize: font.xs, padding: '0.3rem 0.5rem', marginLeft: 'auto',
    background: colors.primaryBg, color: colors.primary, border: `1px solid ${colors.primary}40`,
    borderRadius: radius.sm,
  },

  pauseBanner: { background: colors.warningBg, border: `2px solid ${colors.warning}`, borderRadius: radius.md, padding: '1rem', textAlign: 'center' },
  pauseText: { fontSize: font.xl, fontWeight: 700, color: colors.warning, margin: '0 0 0.5rem' },
  resumeBtn: { ...btnBase, padding: '0.6rem 1.5rem', fontSize: '1rem', background: colors.warning, color: colors.white, borderRadius: radius.md },

  cupHolder: { background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`, color: colors.white, borderRadius: radius.lg, padding: '1.25rem 1rem', textAlign: 'center' },
  cupLabel: { fontSize: font.xs, fontWeight: 600, opacity: 0.85, margin: '0 0 0.15rem', textTransform: 'uppercase', letterSpacing: '0.06em' },
  cupName: { fontSize: '2rem', fontWeight: 800, margin: '0 0 0.15rem' },
  cupSeat: { fontSize: font.base, opacity: 0.85, margin: '0 0 0.35rem' },
  cupScore: { fontSize: '1.5rem', fontWeight: 700, margin: 0 },

  nextUpRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', background: colors.primaryBg, borderRadius: radius.md, padding: '0.45rem 0.75rem' },
  nextUpArrow: { fontSize: font.md, fontWeight: 700, color: colors.primary },
  nextUpLabel: { fontSize: font.xs, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' },
  nextUpName: { fontSize: font.md, fontWeight: 700, color: colors.primary },
  nextUpSeat: { fontSize: font.sm, color: colors.textMuted },

  eventGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' },
  eventBtn: { ...btnBase, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.1rem', padding: '0.7rem 0.25rem', borderRadius: radius.md, color: colors.white, minHeight: '3rem' },
  eventLabel: { fontSize: font.base, fontWeight: 700 },
  eventDelta: { fontSize: font.sm, opacity: 0.85 },

  undoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  undoBtn: { ...btnBase, fontSize: font.sm, padding: '0.4rem 0.75rem', background: colors.surface, border: `1px solid ${colors.border}`, color: colors.textSecondary, borderRadius: radius.sm },
  historyToggle: { ...btnBase, fontSize: font.sm, padding: '0.4rem 0.75rem', background: 'none', border: `1px solid ${colors.border}`, color: colors.primary, borderRadius: radius.sm },

  historyPanel: { background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: '0.5rem', maxHeight: '200px', overflowY: 'auto' },
  historyEmpty: { fontSize: font.sm, color: colors.textMuted, textAlign: 'center', margin: '0.5rem 0' },
  historyRow: { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.4rem', borderBottom: `1px solid ${colors.border}`, fontSize: font.sm },
  historyInning: { color: colors.textMuted, minWidth: '2.5rem', fontSize: font.sm },
  historyName: { flex: 1, fontWeight: 600, color: colors.textPrimary },
  historyEvent: { fontWeight: 600, minWidth: '3.5rem', textAlign: 'right' },
  historyDelta: { fontWeight: 700, minWidth: '1.5rem', textAlign: 'right' },

  scoreboard: { display: 'flex', flexDirection: 'column', gap: '0.15rem', background: colors.surface, borderRadius: radius.lg, padding: '0.6rem' },
  scoreboardTitle: { fontSize: font.xs, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.2rem', paddingLeft: '0.4rem' },
  scoreRow: { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.5rem', borderRadius: radius.sm },
  scoreRank: { fontSize: font.sm, color: colors.textMuted, minWidth: '1rem', fontWeight: 700 },
  scoreName: { flex: 1, fontSize: font.base, fontWeight: 600 },
  cupBadge: { fontSize: font.xs },
  nextBadge: { fontSize: font.xs, color: colors.textMuted, fontWeight: 500, fontStyle: 'italic' },
  scoreSeat: { fontSize: font.xs, color: colors.textMuted },
  scoreVal: { fontSize: font.md, fontWeight: 700 },
  endBtn: { ...btnBase, padding: '0.75rem', fontSize: font.md, background: colors.negative, color: colors.white, borderRadius: radius.md, marginTop: '0.25rem' },

  prevHalfRow: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  prevHalfBtn: {
    ...btnBase, fontSize: font.xs, padding: '0.3rem 0.6rem',
    background: 'none', border: `1px solid ${colors.border}`,
    color: colors.textSecondary, borderRadius: radius.sm,
  },
  prevHalfHint: { fontSize: font.xs, color: colors.textMuted },
};
