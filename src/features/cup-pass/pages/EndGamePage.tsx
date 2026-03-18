import { useNavigate } from 'react-router-dom';
import { useGame } from '../lib/gameContext';
import { rankPlayers } from '../lib/gameLogic';

export default function EndGamePage() {
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const ranked = rankPlayers(state);

  function handlePlayAgain() {
    dispatch({ type: 'RESET' });
    navigate('/create');
  }

  return (
    <main style={s.page}>
      <h1 style={s.title}>Game Over</h1>
      {state.gameName && <p style={s.meta}>{state.gameName}</p>}

      <ol style={s.list}>
        {ranked.map((p, i) => (
          <li key={p.id} style={{ ...s.item, background: i === 0 ? '#fff8e1' : '#f5f5f5', borderLeft: i === 0 ? '4px solid #f9a825' : '4px solid transparent' }}>
            <span style={s.rank}>{i === 0 ? '🏆' : i + 1}</span>
            <span style={s.name}>{p.name}</span>
            {p.seat && <span style={s.seat}>{p.seat}</span>}
            <span style={{ ...s.score, color: p.score > 0 ? '#188038' : p.score < 0 ? '#c62828' : '#333' }}>
              {p.score > 0 ? `+${p.score}` : p.score}
            </span>
          </li>
        ))}
      </ol>

      <button style={s.btn} onClick={handlePlayAgain}>
        Play Again
      </button>
    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', padding: '1.5rem', gap: '1rem', minHeight: '100dvh' },
  title: { fontSize: '2rem', fontWeight: 700 },
  meta: { fontSize: '0.95rem', color: '#555', margin: '-0.5rem 0 0' },
  list: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  item: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', borderRadius: '10px' },
  rank: { fontSize: '1.1rem', minWidth: '1.5rem', textAlign: 'center' },
  name: { flex: 1, fontSize: '1rem', fontWeight: 700 },
  seat: { fontSize: '0.8rem', color: '#777' },
  score: { fontSize: '1.25rem', fontWeight: 700 },
  btn: { marginTop: 'auto', padding: '0.875rem', fontSize: '1rem', fontWeight: 700, background: '#1a73e8', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
};
