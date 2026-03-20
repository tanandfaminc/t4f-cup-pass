import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../lib/gameContext';
import { useRealtimeSubscription } from '../lib/supabase/realtime';
import { rankPlayers, outsInCurrentHalf } from '../lib/gameLogic';
import { colors, font, radius, btnBase, headerBar } from '../lib/theme';
import GameStatusHeader from '../lib/GameStatusHeader';
import type { GameContextState } from '../types';

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

export default function PlayerGamePage() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const { state, dispatch, actions } = useGame();
  const [showHistory, setShowHistory] = useState(false);
  const [coldLoading, setColdLoading] = useState(false);
  const coldLoadAttempted = useRef(false);

  useEffect(() => {
    if (coldLoadAttempted.current) return;
    if (state.dbGameId && state.game && state.publicCode?.toUpperCase() === code?.toUpperCase()) return;
    if (!code) return;

    coldLoadAttempted.current = true;
    setColdLoading(true);
    console.log('[player] cold-start: fetching game by code', code);

    actions
      .joinGame(code, state.playerDisplayName || 'Spectator')
      .then((ok) => {
        if (!ok) {
          console.log('[player] cold-start: game not found for code', code);
        } else {
          console.log('[player] cold-start: game loaded successfully');
        }
      })
      .catch((err) => {
        console.error('[player] cold-start fetch error', err);
      })
      .finally(() => setColdLoading(false));
  }, [code, state.dbGameId, state.game, state.playerDisplayName, actions]);

  const onStateUpdate = useCallback(
    (newState: GameContextState) => {
      dispatch({ type: '_HYDRATE', state: newState });
    },
    [dispatch],
  );

  const { realtimeStatus } = useRealtimeSubscription({
    gameId: state.dbGameId,
    onStateUpdate,
    enabled: state.role === 'player' && !!state.dbGameId,
  });

  const statusColor = realtimeStatus === 'connected' ? colors.positive
    : realtimeStatus === 'connecting' ? colors.warning
    : realtimeStatus === 'error' ? colors.negative
    : colors.textMuted;
  const statusLabel = realtimeStatus === 'connected' ? 'Live'
    : realtimeStatus === 'connecting' ? 'Reconnecting...'
    : realtimeStatus === 'error' ? 'Connection lost'
    : 'Offline';

  if (coldLoading) {
    return (
      <main style={s.page}>
        <div style={s.emptyCard}>
          <p style={s.emptyIcon}>...</p>
          <h2 style={s.emptyTitle}>Loading Game</h2>
          <p style={s.emptyMsg}>Connecting to game {code}...</p>
        </div>
      </main>
    );
  }

  if (!state.game || !state.dbGameId) {
    return (
      <main style={s.page}>
        <div style={s.emptyCard}>
          <p style={s.emptyIcon}>?</p>
          <h2 style={s.emptyTitle}>Game Not Found</h2>
          <p style={s.emptyMsg}>
            {code
              ? `We couldn't find an active game for code "${code}". It may have ended or the code may be wrong.`
              : 'No game is loaded. Ask your host for the join code.'}
          </p>
        </div>
        <button style={s.retryBtn} onClick={() => navigate('/join')}>Try Another Code</button>
        <button style={s.backBtn} onClick={() => navigate('/')}>Home</button>
      </main>
    );
  }

  const game = state.game;
  const { players } = state;
  const currentPlayer = players[game.currentPlayerIndex];
  const nextPlayer = players[(game.currentPlayerIndex + 1) % players.length];
  const ranked = rankPlayers(state);

  const playerNames: Record<string, string> = {};
  for (const p of players) playerNames[p.id] = p.name;

  const connectionBanner = realtimeStatus === 'connecting' ? (
    <div style={s.connectionBanner}>
      <span style={s.spinner} />
      <span style={s.connectionText}>Reconnecting to game...</span>
    </div>
  ) : realtimeStatus === 'error' ? (
    <div style={{ ...s.connectionBanner, background: colors.negativeBg, borderColor: `rgba(239,68,68,0.3)` }}>
      <span style={{ ...s.connectionText, color: colors.negative }}>Connection lost — scores may be stale</span>
    </div>
  ) : null;

  if (game.isFinished) {
    const winner = ranked[0];
    return (
      <main style={s.page}>
        <header style={{ ...headerBar, margin: '0 -0.75rem' }}>
          <span style={{ fontSize: '1.1rem' }}>🏆</span>
          <span style={s.headerBrand}>Tickets 4 Fans</span>
          <span style={s.headerSub}>Cup Pass</span>
        </header>
        <GameStatusHeader
          inningHalf={game.inningHalf}
          inning={game.inning}
          outs={outsInCurrentHalf(game)}
          rightContent={<span style={{ ...s.statusDot, color: statusColor }}>{statusLabel}</span>}
          style={{ margin: '0 -0.75rem' }}
        />
        {state.playerDisplayName && (
          <p style={s.viewerLabel}>Viewing as {state.playerDisplayName}</p>
        )}
        <section style={s.finishedBanner}>
          <p style={s.finishedLabel}>Game Over</p>
          {winner && (
            <p style={s.finishedWinner}>{winner.name} wins with {scoreDisplay(winner.score)}!</p>
          )}
        </section>
        <section style={s.scoreboard}>
          <p style={s.scoreboardTitle}>Final Scores</p>
          {ranked.map((p, i) => (
            <div key={p.id} style={{
              ...s.scoreRow,
              background: i === 0 ? colors.goldBg : 'transparent',
            }}>
              <span style={s.scoreRank}>{i + 1}</span>
              <span style={s.scoreName}>{p.name}</span>
              <span style={{ ...s.scoreVal, color: p.score > 0 ? colors.positive : p.score < 0 ? colors.negative : colors.textSecondary }}>
                {scoreDisplay(p.score)}
              </span>
            </div>
          ))}
        </section>
        <button style={s.leaveBtn} onClick={() => { dispatch({ type: 'RESET' }); navigate('/'); }}>Leave</button>
      </main>
    );
  }

  return (
    <main style={s.page}>
      {/* Branded header bar — matches host view */}
      <header style={{ ...headerBar, margin: '0 -0.75rem' }}>
        <span style={{ fontSize: '1.1rem' }}>🏆</span>
        <span style={s.headerBrand}>Tickets 4 Fans</span>
        <span style={s.headerSub}>Cup Pass</span>
      </header>

      {/* Scorebug strip — shared design with host view */}
      <GameStatusHeader
        inningHalf={game.inningHalf}
        inning={game.inning}
        outs={outsInCurrentHalf(game)}
        rightContent={<span style={{ ...s.statusDot, color: statusColor }}>{statusLabel}</span>}
        style={{ margin: '0 -0.75rem' }}
      />

      {connectionBanner}

      {state.playerDisplayName && (
        <p style={s.viewerLabel}>Viewing as {state.playerDisplayName}</p>
      )}

      {game.isPaused && (
        <section style={s.pauseBanner}>
          <p style={s.pauseText}>Game Paused</p>
          <p style={s.pauseSubtext}>Waiting for host to resume...</p>
        </section>
      )}

      {/* Cup holder */}
      <section style={{ ...s.cupHolder, opacity: game.isPaused ? 0.5 : 1 }}>
        <div style={s.cupBadgeLabel}>CUP HOLDER</div>
        <p style={s.cupName}>{currentPlayer.name}</p>
        <p style={s.cupScore}>{scoreDisplay(game.scores[currentPlayer.id])}</p>
      </section>

      {!game.isPaused && (
        <div style={s.nextUpRow}>
          <span style={s.nextUpLabel}>→ Next Up</span>
          <span style={s.nextUpName}>{nextPlayer.name}</span>
        </div>
      )}

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

      <div style={s.historyToggleRow}>
        <button style={s.historyToggle} onClick={() => setShowHistory(!showHistory)}>
          {showHistory ? 'Hide History' : `History (${game.history.length})`}
        </button>
      </div>

      {showHistory && (
        <section style={s.historyPanel}>
          {game.history.length === 0 ? (
            <p style={s.historyEmpty}>No events yet. Waiting for host to log plays...</p>
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

      {/* Scoreboard */}
      <section style={s.scoreboard}>
        <p style={s.scoreboardTitle}>Scoreboard</p>
        {ranked.map((p, i) => {
          const isCurrent = p.id === currentPlayer.id;
          return (
            <div key={p.id} style={{
              ...s.scoreRow,
              background: isCurrent ? colors.cyanGlow : 'transparent',
              border: isCurrent ? `1px solid ${colors.borderCyan}` : '1px solid transparent',
            }}>
              <span style={s.scoreRank}>{i + 1}</span>
              <span style={{ ...s.scoreName, color: isCurrent ? colors.cyan : colors.textPrimary }}>
                {p.name}
                {isCurrent && <span style={s.cupBadge}> ⚾</span>}
              </span>
              <span style={{ ...s.scoreVal, color: p.score > 0 ? colors.positive : p.score < 0 ? colors.negative : colors.textSecondary }}>
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
  page: {
    display: 'flex', flexDirection: 'column', padding: '0.75rem', gap: '0.65rem', minHeight: '100dvh',
    background: `linear-gradient(180deg, ${colors.pageBg} 0%, #0d1f3c 50%, #0a1628 100%)`,
  },
  headerBrand: { fontSize: font.xs, fontWeight: 800, color: colors.gold, textTransform: 'uppercase', letterSpacing: '0.1em' },
  headerSub: { fontSize: font.sm, fontWeight: 800, color: colors.cyan, textTransform: 'uppercase', letterSpacing: '0.08em' },
  statusDot: { fontSize: '0.7rem', fontWeight: 700 },
  viewerLabel: { fontSize: '0.75rem', color: colors.cyan, fontWeight: 600, textAlign: 'center', margin: '-0.3rem 0 0' },

  connectionBanner: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
    background: colors.warningBg, border: `1px solid rgba(249, 115, 22, 0.3)`,
    borderRadius: radius.md, padding: '0.5rem 0.75rem',
  },
  connectionText: { fontSize: '0.8rem', fontWeight: 600, color: colors.warning },
  spinner: { width: '0.75rem', height: '0.75rem', border: `2px solid ${colors.warning}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' },

  pauseBanner: {
    background: colors.warningBg, border: `2px solid ${colors.warning}`,
    borderRadius: radius.md, padding: '0.75rem', textAlign: 'center',
  },
  pauseText: { fontSize: '1.1rem', fontWeight: 700, color: colors.warning, margin: '0 0 0.15rem' },
  pauseSubtext: { fontSize: '0.75rem', color: colors.textMuted, margin: 0 },

  cupHolder: {
    background: `linear-gradient(135deg, #0f2a4a, ${colors.primaryLight}, #0f2a4a)`,
    border: `2px solid ${colors.borderCyan}`,
    borderRadius: radius.xl, padding: '1.25rem 1rem', textAlign: 'center',
    boxShadow: `0 0 20px rgba(0, 212, 255, 0.2)`,
  },
  cupBadgeLabel: {
    fontSize: font.xs, fontWeight: 800, color: colors.gold, textTransform: 'uppercase',
    letterSpacing: '0.15em', marginBottom: '0.25rem',
    background: 'rgba(245, 158, 11, 0.12)', padding: '0.15rem 0.75rem',
    borderRadius: radius.sm, display: 'inline-block',
    border: `1px solid rgba(245, 158, 11, 0.25)`,
  },
  cupName: { fontSize: '2rem', fontWeight: 800, margin: '0 0 0.15rem', color: colors.white },
  cupScore: { fontSize: '1.5rem', fontWeight: 700, margin: 0, color: colors.gold },

  nextUpRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
    background: colors.surface, borderRadius: radius.md, padding: '0.45rem 0.75rem',
    border: `1px solid ${colors.border}`,
  },
  nextUpLabel: { fontSize: font.xs, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase' },
  nextUpName: { fontSize: font.md, fontWeight: 700, color: colors.white },

  recentEvent: { background: colors.surface, borderRadius: radius.md, padding: '0.5rem 0.75rem', textAlign: 'center', border: `1px solid ${colors.border}` },
  recentLabel: { fontSize: '0.65rem', fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.15rem' },
  recentText: { fontSize: '0.85rem', fontWeight: 600, color: colors.textPrimary, margin: 0 },

  historyToggleRow: { display: 'flex', justifyContent: 'center' },
  historyToggle: { fontSize: '0.8rem', fontWeight: 600, padding: '0.4rem 0.75rem', background: 'none', border: `1px solid ${colors.border}`, borderRadius: radius.sm, cursor: 'pointer', color: colors.cyan },

  historyPanel: { background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: '0.5rem', maxHeight: '200px', overflowY: 'auto' },
  historyEmpty: { fontSize: '0.8rem', color: colors.textMuted, textAlign: 'center', margin: '0.5rem 0' },
  historyRow: { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.4rem', borderBottom: `1px solid ${colors.border}`, fontSize: '0.8rem' },
  historyInning: { color: colors.textMuted, minWidth: '2.5rem', fontSize: '0.75rem' },
  historyName: { flex: 1, fontWeight: 600, color: colors.textPrimary },
  historyEvent: { fontWeight: 600, minWidth: '3.5rem', textAlign: 'right' },
  historyDelta: { fontWeight: 700, minWidth: '1.5rem', textAlign: 'right' },

  scoreboard: { display: 'flex', flexDirection: 'column', gap: '0.2rem', background: colors.surface, borderRadius: radius.lg, padding: '0.6rem', border: `1px solid ${colors.border}` },
  scoreboardTitle: { fontSize: '0.7rem', fontWeight: 700, color: colors.gold, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.2rem', paddingLeft: '0.4rem' },
  scoreRow: { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.5rem', borderRadius: radius.sm },
  scoreRank: { fontSize: '0.75rem', color: colors.textMuted, minWidth: '1rem' },
  scoreName: { flex: 1, fontSize: '0.85rem', fontWeight: 600 },
  cupBadge: { fontSize: '0.7rem' },
  scoreVal: { fontSize: '0.9rem', fontWeight: 700 },

  finishedBanner: {
    background: `linear-gradient(135deg, #0f2a4a, ${colors.primaryLight}, #0f2a4a)`,
    border: `2px solid ${colors.gold}`,
    borderRadius: radius.xl, padding: '1.25rem 1rem', textAlign: 'center',
    boxShadow: `0 0 20px rgba(245, 158, 11, 0.2)`,
  },
  finishedLabel: { fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: colors.gold, margin: '0 0 0.25rem' },
  finishedWinner: { fontSize: '1.1rem', fontWeight: 700, margin: 0, color: colors.white },

  leaveBtn: {
    ...btnBase, padding: '0.65rem', fontSize: '0.85rem', fontWeight: 600,
    background: colors.surface, color: colors.textSecondary,
    border: `1px solid ${colors.border}`, borderRadius: radius.md,
  },

  emptyCard: {
    background: colors.surface, borderRadius: radius.lg, padding: '1.5rem', textAlign: 'center',
    maxWidth: '320px', width: '100%', border: `1px solid ${colors.border}`,
  },
  emptyIcon: {
    width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: colors.surfaceLight,
    color: colors.textMuted, fontSize: '1.25rem', fontWeight: 800, display: 'flex',
    alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem',
  },
  emptyTitle: { fontSize: '1.1rem', fontWeight: 700, color: colors.white, margin: '0 0 0.5rem' },
  emptyMsg: { fontSize: '0.85rem', color: colors.textSecondary, margin: 0, lineHeight: 1.5 },
  retryBtn: {
    ...btnBase, padding: '0.75rem 1.5rem', fontSize: '0.9rem',
    background: `linear-gradient(135deg, ${colors.primaryLight}, ${colors.primary})`,
    color: colors.white, borderRadius: radius.md, border: `1px solid ${colors.borderCyan}`,
  },
  backBtn: { ...btnBase, padding: '0.5rem 1rem', fontSize: '0.85rem', background: 'none', color: colors.cyan },
};
