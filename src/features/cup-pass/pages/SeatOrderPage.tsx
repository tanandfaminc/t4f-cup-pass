import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../lib/gameContext';
import type { Player } from '../types';

let nextId = 1;

export default function SeatOrderPage() {
  const navigate = useNavigate();
  const { actions, backendStatus } = useGame();
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState('');
  const [seat, setSeat] = useState('');
  const [nameError, setNameError] = useState('');

  function addPlayer() {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Name cannot be blank.');
      return;
    }
    if (players.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setNameError('That name is already in the list.');
      return;
    }
    setNameError('');
    setPlayers((prev) => [...prev, { id: String(nextId++), name: trimmed, seat: seat.trim() }]);
    setName('');
    setSeat('');
  }

  function remove(id: string) {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...players];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    setPlayers(next);
  }

  async function handleNext() {
    if (players.length < 2) return;
    await actions.setPlayers(players);
    navigate('/start');
  }

  const canContinue = players.length >= 2;
  const isSaving = backendStatus === 'saving';

  return (
    <main style={s.page}>
      <h1 style={s.title}>Seat Order</h1>
      <p style={s.hint}>Add everyone in seat order. The cup passes down the list.</p>

      <div style={s.addRow}>
        <input
          style={{ ...s.input, flex: 2, borderColor: nameError ? '#c62828' : '#ccc' }}
          placeholder="Name"
          value={name}
          onChange={(e) => { setName(e.target.value); if (nameError) setNameError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
        />
        <input
          style={{ ...s.input, flex: 1 }}
          placeholder="Seat"
          value={seat}
          onChange={(e) => setSeat(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
        />
        <button style={s.addBtn} onClick={addPlayer}>+ Add</button>
      </div>

      {nameError && <p style={s.error}>{nameError}</p>}

      {players.length === 0 && (
        <p style={s.emptyHint}>No players yet. Add at least 2 to start.</p>
      )}

      <ul style={s.list}>
        {players.map((p, i) => (
          <li key={p.id} style={s.item}>
            <span style={s.order}>{i + 1}</span>
            <span style={s.playerName}>{p.name}{p.seat ? <span style={s.seat}> · {p.seat}</span> : null}</span>
            <button style={s.iconBtn} onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
            <button style={s.iconBtn} onClick={() => move(i, 1)} disabled={i === players.length - 1}>↓</button>
            <button style={{ ...s.iconBtn, color: '#c62828' }} onClick={() => remove(p.id)}>✕</button>
          </li>
        ))}
      </ul>

      {players.length === 1 && (
        <p style={s.warning}>Add 1 more player to continue.</p>
      )}

      <button
        style={{ ...s.btn, opacity: canContinue && !isSaving ? 1 : 0.4 }}
        onClick={handleNext}
        disabled={!canContinue || isSaving}
      >
        {isSaving ? 'Saving...' : 'Next: Review & Start →'}
      </button>
    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', padding: '1.5rem', gap: '1rem', minHeight: '100dvh' },
  title: { fontSize: '1.5rem', fontWeight: 700 },
  hint: { fontSize: '0.875rem', color: '#555', margin: 0 },
  addRow: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  input: { padding: '0.65rem 0.75rem', fontSize: '0.95rem', border: '1px solid #ccc', borderRadius: '8px' },
  addBtn: { padding: '0.65rem 0.75rem', fontSize: '0.9rem', fontWeight: 700, background: '#1a73e8', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap' },
  error: { fontSize: '0.8rem', color: '#c62828', margin: '-0.25rem 0 0', fontWeight: 600 },
  emptyHint: { fontSize: '0.85rem', color: '#999', margin: 0, textAlign: 'center', padding: '1.5rem 0' },
  list: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  item: { display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f5f5f5', borderRadius: '8px', padding: '0.6rem 0.75rem' },
  order: { fontWeight: 700, color: '#888', minWidth: '1.25rem', fontSize: '0.85rem' },
  playerName: { flex: 1, fontSize: '0.95rem', fontWeight: 600 },
  seat: { fontWeight: 400, color: '#777' },
  iconBtn: { background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', padding: '0.2rem 0.3rem', color: '#444' },
  warning: { fontSize: '0.85rem', color: '#e65100', margin: 0, fontWeight: 600 },
  btn: { marginTop: 'auto', padding: '0.875rem', fontSize: '1rem', fontWeight: 700, background: '#1a73e8', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
};
