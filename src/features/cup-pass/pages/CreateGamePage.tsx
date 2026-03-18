import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../lib/gameContext';

export default function CreateGamePage() {
  const navigate = useNavigate();
  const { actions, backendStatus } = useGame();
  const [gameName, setGameName] = useState('');
  const [teamName, setTeamName] = useState('');

  async function handleNext() {
    await actions.setGameInfo(gameName.trim(), teamName.trim());
    navigate('/seat-order');
  }

  const isSaving = backendStatus === 'saving';

  return (
    <main style={s.page}>
      <h1 style={s.title}>Create Game</h1>

      <label style={s.label}>
        Game name (optional)
        <input
          style={s.input}
          value={gameName}
          onChange={(e) => setGameName(e.target.value)}
          placeholder="e.g. Row 14 Cup Pass"
        />
      </label>

      <label style={s.label}>
        Team playing today (optional)
        <input
          style={s.input}
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="e.g. Cubs"
        />
      </label>

      <button style={{ ...s.btn, opacity: isSaving ? 0.6 : 1 }} onClick={handleNext} disabled={isSaving}>
        {isSaving ? 'Creating...' : 'Next: Add Players →'}
      </button>
    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', padding: '1.5rem', gap: '1.25rem', minHeight: '100dvh' },
  title: { fontSize: '1.5rem', fontWeight: 700 },
  label: { display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem', fontWeight: 600, color: '#333' },
  input: { padding: '0.75rem', fontSize: '1rem', border: '1px solid #ccc', borderRadius: '8px', width: '100%' },
  btn: { marginTop: 'auto', padding: '0.875rem', fontSize: '1rem', fontWeight: 700, background: '#1a73e8', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
};
