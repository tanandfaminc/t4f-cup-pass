import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../lib/gameContext';
import { colors, font, radius, btnPrimary, btnBase, wordmark } from '../lib/theme';
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
      <div style={s.top}>
        <p style={wordmark}>T4F Cup Pass</p>
        <h1 style={s.title}>Seat Order</h1>
        <p style={s.hint}>Add everyone in seat order. The cup passes down the list.</p>
      </div>

      {/* Add player form — stacked on mobile for more room */}
      <div style={s.addSection}>
        <div style={s.addRow}>
          <input
            style={{ ...s.input, flex: 1, borderColor: nameError ? colors.negative : colors.border }}
            placeholder="Player name"
            value={name}
            onChange={(e) => { setName(e.target.value); if (nameError) setNameError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
          />
          <input
            style={{ ...s.inputSmall, borderColor: colors.border }}
            placeholder="Seat #"
            value={seat}
            onChange={(e) => setSeat(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
          />
        </div>
        <button style={s.addBtn} onClick={addPlayer}>+ Add Player</button>
        {nameError && <p style={s.error}>{nameError}</p>}
      </div>

      {players.length === 0 && (
        <p style={s.emptyHint}>No players yet. Add at least 2 to start.</p>
      )}

      {/* Player list */}
      <ul style={s.list}>
        {players.map((p, i) => (
          <li key={p.id} style={s.item}>
            <span style={s.order}>{i + 1}</span>
            <div style={s.playerInfo}>
              <span style={s.playerName}>{p.name}</span>
              {p.seat && <span style={s.seat}>Seat {p.seat}</span>}
            </div>
            <div style={s.itemActions}>
              <button style={s.iconBtn} onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
              <button style={s.iconBtn} onClick={() => move(i, 1)} disabled={i === players.length - 1} aria-label="Move down">↓</button>
              <button style={{ ...s.iconBtn, color: colors.negative }} onClick={() => remove(p.id)} aria-label="Remove">✕</button>
            </div>
          </li>
        ))}
      </ul>

      {players.length === 1 && (
        <p style={s.warning}>Add 1 more player to continue.</p>
      )}

      <div style={s.bottom}>
        <button
          style={{ ...btnPrimary, width: '100%', opacity: canContinue && !isSaving ? 1 : 0.4 }}
          onClick={handleNext}
          disabled={!canContinue || isSaving}
        >
          {isSaving ? 'Saving...' : 'Next: Review & Start →'}
        </button>
      </div>
    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', padding: '1.25rem', gap: '0.75rem', minHeight: '100dvh' },
  top: { display: 'flex', flexDirection: 'column', gap: '0.3rem', paddingTop: '0.5rem' },
  title: { fontSize: '1.5rem', fontWeight: 800, color: colors.textPrimary, margin: 0 },
  hint: { fontSize: font.base, color: colors.textSecondary, margin: 0 },

  addSection: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  addRow: { display: 'flex', gap: '0.4rem' },
  input: { padding: '0.7rem 0.75rem', fontSize: font.md, border: `1.5px solid ${colors.border}`, borderRadius: radius.md, minWidth: 0 },
  inputSmall: { padding: '0.7rem 0.75rem', fontSize: font.md, border: `1.5px solid ${colors.border}`, borderRadius: radius.md, width: '5rem', flexShrink: 0 },
  addBtn: { ...btnBase, padding: '0.65rem', fontSize: font.base, background: colors.primary, color: colors.white, borderRadius: radius.md, width: '100%' },
  error: { fontSize: font.sm, color: colors.negative, margin: 0, fontWeight: 600 },
  emptyHint: { fontSize: font.base, color: colors.textMuted, margin: 0, textAlign: 'center', padding: '1rem 0' },

  list: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 },
  item: { display: 'flex', alignItems: 'center', gap: '0.5rem', background: colors.surface, borderRadius: radius.md, padding: '0.6rem 0.75rem' },
  order: { fontWeight: 800, color: colors.textMuted, minWidth: '1.25rem', fontSize: font.base },
  playerInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: '0.05rem' },
  playerName: { fontSize: font.md, fontWeight: 700, color: colors.textPrimary },
  seat: { fontSize: font.sm, fontWeight: 500, color: colors.textMuted },
  itemActions: { display: 'flex', gap: '0.15rem', flexShrink: 0 },
  iconBtn: { ...btnBase, background: 'none', fontSize: '1rem', padding: '0.25rem 0.35rem', color: colors.textSecondary, borderRadius: radius.sm },

  warning: { fontSize: font.base, color: colors.warning, margin: 0, fontWeight: 600 },
  bottom: { marginTop: 'auto', paddingTop: '0.5rem' },
};
