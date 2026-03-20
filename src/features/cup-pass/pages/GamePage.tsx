import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../lib/gameContext';
import { rankPlayers, playsInCurrentHalf, outsInCurrentHalf, isHalfComplete } from '../lib/gameLogic';
import { getMode } from '../lib/modes';
import { track } from '../lib/analytics';
import { colors, font, radius, btnBase, headerBar } from '../lib/theme';
import GameStatusHeader from '../lib/GameStatusHeader';
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

function eventBtnBg(delta: number): string {
  if (delta > 0) return `linear-gradient(180deg, ${colors.positive}, ${colors.positiveDark})`;
  if (delta < 0) return `linear-gradient(180deg, ${colors.negative}, ${colors.negativeDark})`;
  return `linear-gradient(180deg, #475569, #334155)`;
}

function scoreColor(delta: number): string {
  if (delta > 0) return colors.positive;
  if (delta < 0) return colors.negative;
  return colors.neutral;
}

function scoreDisplay(score: number): string {
  return score > 0 ? `+${score}` : `${score}`;
}

export default function GamePage() {
  const navigate = useNavigate();
  const { state, dispatch, actions } = useGame();
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);

  // Guard: if there's no active game, bail out to home
  if (!state.game) {
    return (
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', gap: '1rem', padding: '1.5rem', background: colors.pageBg }}>
        <p style={{ fontSize: font.lg, fontWeight: 700, color: colors.textPrimary }}>No active game</p>
        <button style={{ ...btnBase, padding: '0.75rem 1.5rem', background: colors.primaryLight, color: colors.white, borderRadius: radius.md, fontSize: font.md }} onClick={() => navigate('/')}>
          Go Home
        </button>
      </main>
    );
  }

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
  const halfComplete = isHalfComplete(game);
  const boardDisabled = isPaused || halfComplete;
  const dirLabel = game.rotationDirection === 'left' ? 'Passing left →' : '← Passing right';
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

  const playerNames: Record<string, string> = {};
  for (const p of players) playerNames[p.id] = p.name;

  return (
    <main style={s.page}>
      {/* Branded header bar */}
      <header style={headerBar}>
        <span style={{ fontSize: '1.1rem' }}>🏆</span>
        <span style={s.headerBrand}>Tickets 4 Fans</span>
        <span style={s.headerSub}>Cup Pass</span>
      </header>

      {/* Scorebug strip — shared design with player view */}
      <GameStatusHeader
        inningHalf={game.inningHalf}
        inning={game.inning}
        outs={outsInCurrentHalf(game)}
        rightContent={<span style={s.dirLabel}>{dirLabel}</span>}
      />

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
            background: isPaused ? colors.warning : colors.surfaceLight,
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

      {/* Prev-half revert */}
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

      {/* CUP HOLDER — hero section */}
      <section style={{ ...s.cupHolder, opacity: isPaused ? 0.5 : 1 }}>
        <div style={s.cupBadgeLabel}>CUP HOLDER</div>
        <p style={s.cupName}>{currentPlayer.name}</p>
        {currentPlayer.seat && <p style={s.cupSeat}>Seat {currentPlayer.seat}</p>}
        <p style={s.cupScore}>
          {mode.id === 'cup_classic' ? '🪙 ' : '🥇 '}{scoreDisplay(game.scores[currentPlayer.id])} {mode.scoreUnitPlural}
        </p>
      </section>

      {/* Next up */}
      {!isPaused && (
        <div style={s.nextUpRow}>
          <span style={s.nextUpArrow}>→</span>
          <span style={s.nextUpLabel}>Next Up</span>
          <span style={s.nextUpName}>{nextPlayer.name}</span>
        </div>
      )}

      {/* Event buttons */}
      <section style={s.eventGrid}>
        {EVENTS.map(({ event, label, delta }) => (
          <button
            key={event}
            style={{
              ...s.eventBtn,
              background: eventBtnBg(delta),
              opacity: boardDisabled ? 0.3 : 1,
              border: delta > 0 ? `1px solid rgba(34, 197, 94, 0.3)` : delta < 0 ? `1px solid rgba(239, 68, 68, 0.3)` : `1px solid rgba(255,255,255,0.1)`,
            }}
            onClick={() => log(event)}
            disabled={boardDisabled}
          >
            <span style={s.eventLabel}>{label}</span>
            <span style={s.eventDelta}>{delta > 0 ? `+${delta}` : delta === 0 ? '0' : delta}</span>
          </button>
        ))}
      </section>

      {/* Half-complete notice */}
      {halfComplete && !isPaused && (
        <div style={s.halfCompleteNotice}>
          <span style={s.halfCompleteText}>
            3 outs recorded — this half-inning is complete. Undo the last play to make changes.
          </span>
        </div>
      )}

      {/* Undo + History */}
      <div style={s.undoRow}>
        <button
          style={{
            ...s.undoBtn,
            ...(halfComplete && game.history.length > 0 ? s.undoBtnProminent : {}),
            opacity: game.history.length === 0 ? 0.3 : 1,
          }}
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
                <span style={{ ...s.historyEvent, color: scoreColor(ev.delta) }}>
                  {EVENT_LABELS[ev.event] || ev.event}
                </span>
                <span style={{ ...s.historyDelta, color: scoreColor(ev.delta) }}>
                  {ev.delta > 0 ? `+${ev.delta}` : ev.delta}
                </span>
              </div>
            ))
          )}
        </section>
      )}

      {/* Scoreboard */}
      <section style={s.scoreboard}>
        <p style={s.scoreboardTitle}>
          {mode.id === 'cup_classic' ? '🪙 Coin Totals' : '🥇 Scoreboard'}
        </p>
        {ranked.map((p, i) => {
          const isCurrent = p.id === currentPlayer.id;
          const isNext = p.id === nextPlayer.id;
          return (
            <div key={p.id} style={{
              ...s.scoreRow,
              background: isCurrent ? 'rgba(0, 212, 255, 0.12)' : isNext ? 'rgba(0, 212, 255, 0.05)' : 'transparent',
              border: isCurrent ? `1px solid ${colors.borderCyan}` : '1px solid transparent',
            }}>
              <span style={s.scoreRank}>{i + 1}</span>
              <span style={{ ...s.scoreName, color: isCurrent ? colors.cyan : colors.textPrimary }}>
                {p.name}
                {isCurrent && <span style={s.cupBadge}> ⚾</span>}
                {isNext && <span style={s.nextBadge}> next</span>}
              </span>
              {p.seat && <span style={s.scoreSeat}>{p.seat}</span>}
              <span style={{ ...s.scoreVal, color: p.score > 0 ? colors.positive : p.score < 0 ? colors.negative : colors.textSecondary }}>
                {scoreDisplay(p.score)}
              </span>
            </div>
          );
        })}
      </section>

      {/* Bottom actions */}
      <div style={s.bottomRow}>
        <button style={s.endBtn} onClick={handleEnd}>End Game</button>
        <button
          style={s.leaveBtn}
          onClick={() => {
            if (window.confirm('Leave this game? The game will still be active for other players.')) {
              dispatch({ type: 'RESET' });
              navigate('/');
            }
          }}
        >
          Leave
        </button>
      </div>
    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex', flexDirection: 'column', gap: '0.6rem', minHeight: '100dvh', paddingBottom: '1.5rem',
    background: `linear-gradient(180deg, ${colors.pageBg} 0%, #0d1f3c 50%, #0a1628 100%)`,
  },

  // Header
  headerBrand: { fontSize: font.xs, fontWeight: 800, color: colors.gold, textTransform: 'uppercase', letterSpacing: '0.1em' },
  headerSub: { fontSize: font.sm, fontWeight: 800, color: colors.cyan, textTransform: 'uppercase', letterSpacing: '0.08em' },
  dirLabel: { fontSize: font.sm, fontWeight: 700, color: colors.cyan },

  // Controls
  controlRow: { display: 'flex', gap: '0.35rem', flexWrap: 'wrap', padding: '0 0.75rem' },
  controlBtn: {
    ...btnBase, fontSize: font.sm, padding: '0.35rem 0.6rem',
    background: colors.surfaceLight, color: colors.textPrimary, borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
  },
  shareBtn: {
    ...btnBase, fontSize: font.xs, padding: '0.3rem 0.5rem', marginLeft: 'auto',
    background: colors.primaryBg, color: colors.cyan, border: `1px solid ${colors.borderCyan}`,
    borderRadius: radius.sm,
  },

  // Pause
  pauseBanner: {
    background: 'rgba(249, 115, 22, 0.1)', border: `2px solid ${colors.warning}`,
    borderRadius: radius.md, padding: '1rem', textAlign: 'center', margin: '0 0.75rem',
  },
  pauseText: { fontSize: font.xl, fontWeight: 700, color: colors.warning, margin: '0 0 0.5rem' },
  resumeBtn: { ...btnBase, padding: '0.6rem 1.5rem', fontSize: '1rem', background: colors.warning, color: colors.white, borderRadius: radius.md },

  // Cup Holder hero
  cupHolder: {
    background: `linear-gradient(135deg, #0f2a4a, ${colors.primaryLight}, #0f2a4a)`,
    border: `2px solid ${colors.borderCyan}`,
    borderRadius: radius.xl,
    padding: '1.5rem 1rem 1.25rem',
    textAlign: 'center',
    margin: '0 0.75rem',
    boxShadow: `0 0 20px rgba(0, 212, 255, 0.2), inset 0 0 20px rgba(0, 212, 255, 0.05)`,
    position: 'relative',
  },
  cupBadgeLabel: {
    fontSize: font.xs, fontWeight: 800, color: colors.gold, textTransform: 'uppercase',
    letterSpacing: '0.15em', marginBottom: '0.35rem',
    background: 'rgba(245, 158, 11, 0.12)', padding: '0.15rem 0.75rem',
    borderRadius: radius.sm, display: 'inline-block',
    border: `1px solid rgba(245, 158, 11, 0.25)`,
  },
  cupName: { fontSize: font.hero, fontWeight: 900, margin: '0.2rem 0 0.1rem', color: colors.white },
  cupSeat: { fontSize: font.base, opacity: 0.7, margin: '0 0 0.35rem', color: colors.textSecondary },
  cupScore: { fontSize: '1.5rem', fontWeight: 700, margin: 0, color: colors.gold },

  // Next up
  nextUpRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
    background: colors.surface, borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}`,
    padding: '0.5rem 0.75rem',
  },
  nextUpArrow: { fontSize: font.md, fontWeight: 700, color: colors.cyan },
  nextUpLabel: { fontSize: font.xs, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' },
  nextUpName: { fontSize: font.md, fontWeight: 700, color: colors.white },

  // Event buttons
  eventGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', padding: '0 0.75rem' },
  eventBtn: {
    ...btnBase, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: '0.1rem', padding: '0.75rem 0.25rem', borderRadius: radius.md, color: colors.white,
    minHeight: '3.2rem', boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
  },
  eventLabel: { fontSize: font.base, fontWeight: 700 },
  eventDelta: { fontSize: font.sm, opacity: 0.85 },

  // Half-complete notice
  halfCompleteNotice: {
    background: colors.infoBg, border: `1px solid rgba(56, 189, 248, 0.2)`,
    borderRadius: radius.md, padding: '0.5rem 0.75rem', textAlign: 'center' as const, margin: '0 0.75rem',
  },
  halfCompleteText: { fontSize: font.sm, fontWeight: 600, color: colors.info },

  // Undo row
  undoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.75rem' },
  undoBtn: {
    ...btnBase, fontSize: font.sm, padding: '0.4rem 0.75rem',
    background: colors.surface, border: `1px solid ${colors.border}`, color: colors.textSecondary, borderRadius: radius.sm,
  },
  undoBtnProminent: { background: colors.cyan, color: '#0a1628', border: 'none', padding: '0.55rem 1.1rem', fontSize: font.md },
  historyToggle: { ...btnBase, fontSize: font.sm, padding: '0.4rem 0.75rem', background: 'none', border: `1px solid ${colors.border}`, color: colors.cyan, borderRadius: radius.sm },

  // History panel
  historyPanel: { background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: '0.5rem', maxHeight: '200px', overflowY: 'auto', margin: '0 0.75rem' },
  historyEmpty: { fontSize: font.sm, color: colors.textMuted, textAlign: 'center', margin: '0.5rem 0' },
  historyRow: { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.4rem', borderBottom: `1px solid ${colors.border}`, fontSize: font.sm },
  historyInning: { color: colors.textMuted, minWidth: '2.5rem', fontSize: font.sm },
  historyName: { flex: 1, fontWeight: 600, color: colors.textPrimary },
  historyEvent: { fontWeight: 600, minWidth: '3.5rem', textAlign: 'right' },
  historyDelta: { fontWeight: 700, minWidth: '1.5rem', textAlign: 'right' },

  // Scoreboard
  scoreboard: { display: 'flex', flexDirection: 'column', gap: '0.2rem', background: colors.surface, borderRadius: radius.lg, padding: '0.6rem', margin: '0 0.75rem', border: `1px solid ${colors.border}` },
  scoreboardTitle: { fontSize: font.xs, fontWeight: 700, color: colors.gold, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.2rem', paddingLeft: '0.4rem' },
  scoreRow: { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.5rem', borderRadius: radius.sm },
  scoreRank: { fontSize: font.sm, color: colors.textMuted, minWidth: '1rem', fontWeight: 700 },
  scoreName: { flex: 1, fontSize: font.base, fontWeight: 600 },
  cupBadge: { fontSize: font.xs },
  nextBadge: { fontSize: font.xs, color: colors.textMuted, fontWeight: 500, fontStyle: 'italic' },
  scoreSeat: { fontSize: font.xs, color: colors.textMuted },
  scoreVal: { fontSize: font.md, fontWeight: 700 },

  // Bottom actions
  bottomRow: { display: 'flex', gap: '0.5rem', alignItems: 'stretch', padding: '0 0.75rem' },
  endBtn: {
    ...btnBase, flex: 1, padding: '0.85rem', fontSize: font.md,
    background: `linear-gradient(180deg, ${colors.negative}, ${colors.negativeDark})`,
    color: colors.white, borderRadius: radius.md,
    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
  },
  leaveBtn: { ...btnBase, padding: '0.75rem 1rem', fontSize: font.sm, background: 'none', color: colors.textMuted, border: `1px solid ${colors.border}`, borderRadius: radius.md },

  // Prev half
  prevHalfRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 0.75rem' },
  prevHalfBtn: {
    ...btnBase, fontSize: font.xs, padding: '0.3rem 0.6rem',
    background: 'none', border: `1px solid ${colors.border}`,
    color: colors.textSecondary, borderRadius: radius.sm,
  },
  prevHalfHint: { fontSize: font.xs, color: colors.textMuted },
};
