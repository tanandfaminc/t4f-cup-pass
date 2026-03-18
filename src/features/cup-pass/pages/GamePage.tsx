import { useNavigate } from 'react-router-dom';
import { useGame } from '../lib/gameContext';
import { rankPlayers } from '../lib/gameLogic';
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

function eventColor(delta: number): string {
  if (delta > 0) return '#188038';
  if (delta < 0) return '#c62828';
  return '#546e7a';
}

export default function GamePage() {
  const navigate = useNavigate();
  const { state, dispatch } = useGame();

  const game = state.game!;
  const { players } = state;
  const currentPlayer = players[game.currentPlayerIndex];
  const ranked = rankPlayers(state);

  function log(event: HitEvent) {
    dispatch({ type: 'LOG_EVENT', event });
  }

  function handleEnd() {
    if (!window.confirm('End the game now?')) return;
    dispatch({ type: 'END_GAME' });
    navigate('/end');
  }

  return (
    <main style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <span style={s.inning}>Inning {game.inning}</span>
        <span style={s.gameName}>{state.gameName || 'Cup Pass'}</span>
        <button style={s.inningBtn} onClick={() => dispatch({ type: 'NEXT_INNING' })}>
          +Inn
        </button>
      </header>

      {/* Current cup holder */}
      <section style={s.cupHolder}>
        <p style={s.cupLabel}>Cup is with</p>
        <p style={s.cupName}>{currentPlayer.name}</p>
        {currentPlayer.seat && <p style={s.cupSeat}>{currentPlayer.seat}</p>}
        <p style={s.cupScore}>{game.scores[currentPlayer.id] > 0 ? '+' : ''}{game.scores[currentPlayer.id]}</p>
      </section>

      {/* Event buttons */}
      <section style={s.eventGrid}>
        {EVENTS.map(({ event, label, delta }) => (
          <button
            key={event}
            style={{ ...s.eventBtn, background: eventColor(delta) }}
            onClick={() => log(event)}
          >
            <span style={s.eventLabel}>{label}</span>
            <span style={s.eventDelta}>{delta > 0 ? `+${delta}` : delta === 0 ? '0' : delta}</span>
          </button>
        ))}
      </section>

      {/* Mini scoreboard */}
      <section style={s.scoreboard}>
        {ranked.map((p, i) => (
          <div key={p.id} style={{ ...s.scoreRow, background: p.id === currentPlayer.id ? '#e8f0fe' : 'transparent' }}>
            <span style={s.scoreRank}>{i + 1}</span>
            <span style={s.scoreName}>{p.name}</span>
            <span style={{ ...s.scoreVal, color: p.score > 0 ? '#188038' : p.score < 0 ? '#c62828' : '#333' }}>
              {p.score > 0 ? `+${p.score}` : p.score}
            </span>
          </div>
        ))}
      </section>

      <button style={s.endBtn} onClick={handleEnd}>End Game</button>
    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', padding: '0.875rem', gap: '0.875rem', minHeight: '100dvh' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  inning: { fontSize: '0.85rem', fontWeight: 700, color: '#555' },
  gameName: { fontSize: '0.85rem', color: '#888' },
  inningBtn: { fontSize: '0.75rem', fontWeight: 700, padding: '0.3rem 0.6rem', background: '#e0e0e0', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  cupHolder: { background: '#1a73e8', color: '#fff', borderRadius: '12px', padding: '1rem', textAlign: 'center' },
  cupLabel: { fontSize: '0.75rem', fontWeight: 600, opacity: 0.8, margin: '0 0 0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
  cupName: { fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.2rem' },
  cupSeat: { fontSize: '0.85rem', opacity: 0.8, margin: '0 0 0.4rem' },
  cupScore: { fontSize: '1.25rem', fontWeight: 700, opacity: 0.9, margin: 0 },
  eventGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' },
  eventBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.15rem', padding: '0.65rem 0.25rem', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#fff' },
  eventLabel: { fontSize: '0.85rem', fontWeight: 700 },
  eventDelta: { fontSize: '0.75rem', opacity: 0.85 },
  scoreboard: { display: 'flex', flexDirection: 'column', gap: '0.25rem', background: '#f5f5f5', borderRadius: '10px', padding: '0.75rem' },
  scoreRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.4rem', borderRadius: '6px' },
  scoreRank: { fontSize: '0.8rem', color: '#999', minWidth: '1rem' },
  scoreName: { flex: 1, fontSize: '0.9rem', fontWeight: 600 },
  scoreVal: { fontSize: '0.9rem', fontWeight: 700 },
  endBtn: { marginTop: 'auto', padding: '0.75rem', fontSize: '0.9rem', fontWeight: 700, background: '#c62828', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
};
