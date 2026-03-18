import { useNavigate } from 'react-router-dom';
import { useGame } from '../lib/gameContext';

export default function StartConfirmPage() {
  const navigate = useNavigate();
  const { state, actions, backendStatus } = useGame();

  async function handleStart() {
    await actions.startGame();
    navigate('/game');
  }

  const isSaving = backendStatus === 'saving';

  return (
    <main style={s.page}>
      <h1 style={s.title}>Ready to Play?</h1>

      {state.gameName && <p style={s.meta}>{state.gameName}{state.teamName ? ` · ${state.teamName}` : ''}</p>}

      {state.publicCode && (
        <p style={s.code}>Game code: <strong>{state.publicCode}</strong></p>
      )}

      <section style={s.section}>
        <p style={s.sectionLabel}>Cup order ({state.players.length} players)</p>
        <ol style={s.list}>
          {state.players.map((p) => (
            <li key={p.id} style={s.item}>
              <span style={s.playerName}>{p.name}</span>
              {p.seat && <span style={s.seat}>{p.seat}</span>}
            </li>
          ))}
        </ol>
      </section>

      <button style={{ ...s.btn, opacity: isSaving ? 0.6 : 1 }} onClick={handleStart} disabled={isSaving}>
        {isSaving ? 'Starting...' : '⚾ Start Game'}
      </button>
      <button style={s.backBtn} onClick={() => navigate('/seat-order')}>
        ← Back to Seat Order
      </button>
    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', padding: '1.5rem', gap: '1rem', minHeight: '100dvh' },
  title: { fontSize: '1.5rem', fontWeight: 700 },
  meta: { fontSize: '0.95rem', color: '#555', margin: 0 },
  code: { fontSize: '0.9rem', color: '#1a73e8', margin: 0, fontWeight: 600 },
  section: { background: '#f5f5f5', borderRadius: '10px', padding: '1rem' },
  sectionLabel: { fontSize: '0.8rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.75rem' },
  list: { margin: 0, padding: '0 0 0 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  item: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1rem' },
  playerName: { fontWeight: 600 },
  seat: { fontSize: '0.85rem', color: '#777' },
  btn: { marginTop: 'auto', padding: '0.875rem', fontSize: '1.1rem', fontWeight: 700, background: '#188038', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  backBtn: { padding: '0.6rem', fontSize: '0.9rem', fontWeight: 600, background: 'none', border: 'none', color: '#1a73e8', cursor: 'pointer', textAlign: 'center' as const },
};
