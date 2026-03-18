import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../lib/gameContext';
import { rankPlayers } from '../lib/gameLogic';
import { track } from '../lib/analytics';
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
  if (delta > 0) return '#188038';
  if (delta < 0) return '#c62828';
  return '#546e7a';
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
  const nextPlayer = players[(game.currentPlayerIndex + 1) % players.length];
  const ranked = rankPlayers(state);
  const isPaused = game.isPaused;

  function log(event: HitEvent) {
    actions.logEvent(event);
  }

  async function handleEnd() {
    if (!window.confirm('End the game now?')) return;
    await actions.endGame();
    navigate('/end');
  }

  // Build player name lookup for history
  const playerNames: Record<string, string> = {};
  for (const p of players) playerNames[p.id] = p.name;

  return (
    <main style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.inning}>Inning {game.inning}</span>
          <span style={s.eventCount}>{game.history.length} plays</span>
        </div>
        <span style={s.gameName}>{state.gameName || 'Cup Pass'}</span>
        <div style={s.headerActions}>
          <button style={s.headerBtn} onClick={() => actions.nextInning()}>+Inn</button>
          <button
            style={{ ...s.headerBtn, background: isPaused ? '#e65100' : '#e0e0e0', color: isPaused ? '#fff' : '#333' }}
            onClick={() => isPaused ? actions.resume() : actions.pause()}
          >
            {isPaused ? '▶ Play' : '⏸ Pause'}
          </button>
        </div>
      </header>

      {/* Public code badge — shareable */}
      {state.publicCode && (
        <div style={s.codeRow}>
          <p style={s.codeBadge}>Code: <span style={s.codeValue}>{state.publicCode}</span></p>
          <button style={s.shareBtn} onClick={handleShare}>
            {copied ? 'Copied!' : 'Share'}
          </button>
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
        <p style={s.cupScore}>{scoreDisplay(game.scores[currentPlayer.id])}</p>
      </section>

      {/* Next up indicator — more prominent */}
      {!isPaused && (
        <div style={s.nextUpRow}>
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

      {/* Undo button */}
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
                <span style={s.historyInning}>Inn {ev.inning}</span>
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
        <p style={s.scoreboardTitle}>Scoreboard</p>
        {ranked.map((p, i) => {
          const isCurrent = p.id === currentPlayer.id;
          return (
            <div key={p.id} style={{
              ...s.scoreRow,
              background: isCurrent ? '#e8f0fe' : 'transparent',
              border: isCurrent ? '2px solid #1a73e8' : '2px solid transparent',
            }}>
              <span style={s.scoreRank}>{i + 1}</span>
              <span style={{ ...s.scoreName, color: isCurrent ? '#1a73e8' : '#333' }}>
                {p.name}
                {isCurrent && <span style={s.cupBadge}> ⚾</span>}
              </span>
              {p.seat && <span style={s.scoreSeat}>{p.seat}</span>}
              <span style={{ ...s.scoreVal, color: p.score > 0 ? '#188038' : p.score < 0 ? '#c62828' : '#333' }}>
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
  page: { display: 'flex', flexDirection: 'column', padding: '0.75rem', gap: '0.65rem', minHeight: '100dvh' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { display: 'flex', flexDirection: 'column', gap: '0.05rem' },
  inning: { fontSize: '0.9rem', fontWeight: 700, color: '#333' },
  eventCount: { fontSize: '0.65rem', fontWeight: 600, color: '#999' },
  gameName: { fontSize: '0.8rem', color: '#888' },
  headerActions: { display: 'flex', gap: '0.35rem' },
  headerBtn: { fontSize: '0.75rem', fontWeight: 700, padding: '0.35rem 0.6rem', background: '#e0e0e0', border: 'none', borderRadius: '6px', cursor: 'pointer' },

  codeRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: '-0.3rem 0 0' },
  codeBadge: { fontSize: '0.7rem', color: '#1a73e8', fontWeight: 700, margin: 0 },
  codeValue: { fontSize: '0.85rem', letterSpacing: '0.1em' },
  shareBtn: { fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.5rem', background: '#e8f0fe', color: '#1a73e8', border: '1px solid #1a73e8', borderRadius: '4px', cursor: 'pointer' },

  pauseBanner: { background: '#fff3e0', border: '2px solid #e65100', borderRadius: '10px', padding: '1rem', textAlign: 'center' },
  pauseText: { fontSize: '1.25rem', fontWeight: 700, color: '#e65100', margin: '0 0 0.5rem' },
  resumeBtn: { padding: '0.6rem 1.5rem', fontSize: '1rem', fontWeight: 700, background: '#e65100', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },

  cupHolder: { background: '#1a73e8', color: '#fff', borderRadius: '14px', padding: '1.25rem 1rem', textAlign: 'center' },
  cupLabel: { fontSize: '0.7rem', fontWeight: 600, opacity: 0.85, margin: '0 0 0.15rem', textTransform: 'uppercase', letterSpacing: '0.06em' },
  cupName: { fontSize: '2rem', fontWeight: 800, margin: '0 0 0.15rem' },
  cupSeat: { fontSize: '0.85rem', opacity: 0.85, margin: '0 0 0.35rem' },
  cupScore: { fontSize: '1.5rem', fontWeight: 700, margin: 0 },

  nextUpRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', background: '#e8f0fe', borderRadius: '8px', padding: '0.45rem 0.75rem' },
  nextUpLabel: { fontSize: '0.7rem', fontWeight: 700, color: '#5f6368', textTransform: 'uppercase', letterSpacing: '0.04em' },
  nextUpName: { fontSize: '0.95rem', fontWeight: 700, color: '#1a73e8' },
  nextUpSeat: { fontSize: '0.75rem', color: '#5f6368' },

  eventGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem' },
  eventBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.1rem', padding: '0.75rem 0.25rem', border: 'none', borderRadius: '10px', cursor: 'pointer', color: '#fff', minHeight: '3.2rem' },
  eventLabel: { fontSize: '0.9rem', fontWeight: 700 },
  eventDelta: { fontSize: '0.75rem', opacity: 0.85 },

  undoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  undoBtn: { fontSize: '0.8rem', fontWeight: 600, padding: '0.4rem 0.75rem', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', color: '#555' },
  historyToggle: { fontSize: '0.8rem', fontWeight: 600, padding: '0.4rem 0.75rem', background: 'none', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', color: '#1a73e8' },

  historyPanel: { background: '#fafafa', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '0.5rem', maxHeight: '200px', overflowY: 'auto' },
  historyEmpty: { fontSize: '0.8rem', color: '#999', textAlign: 'center', margin: '0.5rem 0' },
  historyRow: { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.4rem', borderBottom: '1px solid #eee', fontSize: '0.8rem' },
  historyInning: { color: '#999', minWidth: '2.5rem', fontSize: '0.75rem' },
  historyName: { flex: 1, fontWeight: 600, color: '#333' },
  historyEvent: { fontWeight: 600, minWidth: '3.5rem', textAlign: 'right' },
  historyDelta: { fontWeight: 700, minWidth: '1.5rem', textAlign: 'right' },

  scoreboard: { display: 'flex', flexDirection: 'column', gap: '0.2rem', background: '#f5f5f5', borderRadius: '10px', padding: '0.6rem' },
  scoreboardTitle: { fontSize: '0.7rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.2rem', paddingLeft: '0.4rem' },
  scoreRow: { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.5rem', borderRadius: '6px' },
  scoreRank: { fontSize: '0.75rem', color: '#999', minWidth: '1rem' },
  scoreName: { flex: 1, fontSize: '0.85rem', fontWeight: 600 },
  cupBadge: { fontSize: '0.7rem' },
  scoreSeat: { fontSize: '0.7rem', color: '#999' },
  scoreVal: { fontSize: '0.9rem', fontWeight: 700 },
  endBtn: { padding: '0.75rem', fontSize: '0.9rem', fontWeight: 700, background: '#c62828', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
};
