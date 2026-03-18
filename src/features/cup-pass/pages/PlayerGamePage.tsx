import { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../lib/gameContext';
import { useRealtimeSubscription } from '../lib/supabase/realtime';
import { rankPlayers } from '../lib/gameLogic';
import type { GameContextState } from '../types';

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

export default function PlayerGamePage() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const { state, dispatch } = useGame();
  const [showHistory, setShowHistory] = useState(false);

  // Realtime subscription — updates state when host makes changes
  const onStateUpdate = useCallback(
    (newState: GameContextState) => {
      dispatch({
        type: '_HYDRATE',
        state: { ...newState, role: 'player', playerDisplayName: state.playerDisplayName },
      });
    },
    [dispatch, state.playerDisplayName],
  );

  const { realtimeStatus } = useRealtimeSubscription({
    gameId: state.dbGameId,
    onStateUpdate,
    enabled: state.role === 'player' && !!state.dbGameId,
  });

  // Not-found / no-game state
  if (!state.game || !state.dbGameId) {
    return (
      <main style={s.page}>
        <h2 style={s.title}>Game Not Found</h2>
        <p style={s.subtitle}>
          {code ? `No active game found for code "${code}".` : 'No game loaded.'}
        </p>
        <button style={s.backBtn} onClick={() => navigate('/join')}>Try Again</button>
      </main>
    );
  }

  const game = state.game;
  const { players } = state;
  const currentPlayer = players[game.currentPlayerIndex];
  const nextPlayer = players[(game.currentPlayerIndex + 1) % players.length];
  const ranked = rankPlayers(state);

  // Connection status indicator
  const statusColor = realtimeStatus === 'connected' ? '#188038'
    : realtimeStatus === 'connecting' ? '#e65100'
    : realtimeStatus === 'error' ? '#c62828'
    : '#999';
  const statusLabel = realtimeStatus === 'connected' ? 'Live'
    : realtimeStatus === 'connecting' ? 'Connecting...'
    : realtimeStatus === 'error' ? 'Connection error'
    : 'Offline';

  // Build player name lookup for history
  const playerNames: Record<string, string> = {};
  for (const p of players) playerNames[p.id] = p.name;

  if (game.isFinished) {
    return (
      <main style={s.page}>
        <header style={s.header}>
          <span style={s.gameName}>{state.gameName || 'Cup Pass'}</span>
          <span style={{ ...s.statusDot, color: statusColor }}>{statusLabel}</span>
        </header>
        <section style={s.finishedBanner}>
          <p style={s.finishedText}>Game Over</p>
          {ranked.length > 0 && (
            <p style={s.winnerText}>{ranked[0].name} wins with {scoreDisplay(ranked[0].score)}!</p>
          )}
        </section>
        <section style={s.scoreboard}>
          <p style={s.scoreboardTitle}>Final Scores</p>
          {ranked.map((p, i) => (
            <div key={p.id} style={s.scoreRow}>
              <span style={s.scoreRank}>{i + 1}</span>
              <span style={s.scoreName}>{p.name}</span>
              <span style={{ ...s.scoreVal, color: p.score > 0 ? '#188038' : p.score < 0 ? '#c62828' : '#333' }}>
                {scoreDisplay(p.score)}
              </span>
            </div>
          ))}
        </section>
        <button style={s.backBtn} onClick={() => { dispatch({ type: 'RESET' }); navigate('/'); }}>Leave</button>
      </main>
    );
  }

  return (
    <main style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <div>
          <span style={s.inning}>Inning {game.inning}</span>
          <span style={s.gameName}> — {state.gameName || 'Cup Pass'}</span>
        </div>
        <span style={{ ...s.statusDot, color: statusColor }}>{statusLabel}</span>
      </header>

      {/* Viewer label */}
      {state.playerDisplayName && (
        <p style={s.viewerLabel}>Viewing as {state.playerDisplayName}</p>
      )}

      {/* Pause banner */}
      {game.isPaused && (
        <section style={s.pauseBanner}>
          <p style={s.pauseText}>Game Paused</p>
        </section>
      )}

      {/* Current cup holder */}
      <section style={{ ...s.cupHolder, opacity: game.isPaused ? 0.5 : 1 }}>
        <p style={s.cupLabel}>Cup is with</p>
        <p style={s.cupName}>{currentPlayer.name}</p>
        <p style={s.cupScore}>{scoreDisplay(game.scores[currentPlayer.id])}</p>
      </section>

      {/* Next up */}
      {!game.isPaused && (
        <p style={s.nextUp}>
          Next up: <strong>{nextPlayer.name}</strong>
        </p>
      )}

      {/* Recent events */}
      {game.history.length > 0 && (
        <section style={s.recentEvent}>
          <p style={s.recentLabel}>Last play</p>
          <p style={s.recentText}>
            {playerNames[game.history[game.history.length - 1].playerId]}
            {' — '}
            <span style={{ color: eventColor(game.history[game.history.length - 1].delta) }}>
              {EVENT_LABELS[game.history[game.history.length - 1].event] ?? game.history[game.history.length - 1].event}
              {' '}
              ({game.history[game.history.length - 1].delta > 0 ? '+' : ''}{game.history[game.history.length - 1].delta})
            </span>
          </p>
        </section>
      )}

      {/* History toggle */}
      <div style={s.historyToggleRow}>
        <button style={s.historyToggle} onClick={() => setShowHistory(!showHistory)}>
          {showHistory ? 'Hide History' : `History (${game.history.length})`}
        </button>
      </div>

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

      {/* Scoreboard */}
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
              <span style={{ ...s.scoreVal, color: p.score > 0 ? '#188038' : p.score < 0 ? '#c62828' : '#333' }}>
                {scoreDisplay(p.score)}
              </span>
            </div>
          );
        })}
      </section>

      <button style={s.leaveBtn} onClick={() => { dispatch({ type: 'RESET' }); navigate('/'); }}>Leave Game</button>
    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', padding: '0.75rem', gap: '0.65rem', minHeight: '100dvh' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  inning: { fontSize: '0.9rem', fontWeight: 700, color: '#333' },
  gameName: { fontSize: '0.8rem', color: '#888' },
  title: { fontSize: '1.5rem', fontWeight: 700, margin: 0, textAlign: 'center' },
  subtitle: { fontSize: '0.9rem', color: '#555', textAlign: 'center' },
  statusDot: { fontSize: '0.7rem', fontWeight: 700 },
  viewerLabel: { fontSize: '0.75rem', color: '#1a73e8', fontWeight: 600, textAlign: 'center', margin: '-0.3rem 0 0' },

  pauseBanner: { background: '#fff3e0', border: '2px solid #e65100', borderRadius: '10px', padding: '0.75rem', textAlign: 'center' },
  pauseText: { fontSize: '1.1rem', fontWeight: 700, color: '#e65100', margin: 0 },

  cupHolder: { background: '#1a73e8', color: '#fff', borderRadius: '14px', padding: '1.25rem 1rem', textAlign: 'center' },
  cupLabel: { fontSize: '0.7rem', fontWeight: 600, opacity: 0.85, margin: '0 0 0.15rem', textTransform: 'uppercase', letterSpacing: '0.06em' },
  cupName: { fontSize: '2rem', fontWeight: 800, margin: '0 0 0.15rem' },
  cupScore: { fontSize: '1.5rem', fontWeight: 700, margin: 0 },

  nextUp: { fontSize: '0.8rem', color: '#555', textAlign: 'center', margin: 0 },

  recentEvent: { background: '#f5f5f5', borderRadius: '8px', padding: '0.5rem 0.75rem', textAlign: 'center' },
  recentLabel: { fontSize: '0.65rem', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.15rem' },
  recentText: { fontSize: '0.85rem', fontWeight: 600, color: '#333', margin: 0 },

  historyToggleRow: { display: 'flex', justifyContent: 'center' },
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
  scoreVal: { fontSize: '0.9rem', fontWeight: 700 },

  finishedBanner: { background: '#e8f5e9', border: '2px solid #188038', borderRadius: '10px', padding: '1rem', textAlign: 'center' },
  finishedText: { fontSize: '1.25rem', fontWeight: 700, color: '#188038', margin: '0 0 0.25rem' },
  winnerText: { fontSize: '1rem', fontWeight: 600, color: '#333', margin: 0 },

  leaveBtn: { padding: '0.65rem', fontSize: '0.85rem', fontWeight: 600, background: '#f5f5f5', color: '#555', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' },
  backBtn: { padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600, background: 'none', border: 'none', color: '#1a73e8', cursor: 'pointer' },
};
