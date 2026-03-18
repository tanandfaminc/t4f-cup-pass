import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../lib/gameContext';

export default function JoinPage() {
  const navigate = useNavigate();
  const { code: urlCode } = useParams<{ code?: string }>();
  const { actions, backendStatus, isBackendConnected } = useGame();

  const [code, setCode] = useState(urlCode?.toUpperCase() ?? '');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');

  const isLoading = backendStatus === 'loading';
  const canSubmit = code.trim().length > 0 && displayName.trim().length > 0 && !isLoading;

  async function handleJoin() {
    if (!canSubmit) return;
    setError('');
    const trimmedCode = code.trim().toUpperCase();
    const ok = await actions.joinGame(trimmedCode, displayName.trim());
    if (ok) {
      navigate(`/play/${trimmedCode}`);
    } else {
      setError('Game not found. Check the code and try again.');
    }
  }

  if (!isBackendConnected) {
    return (
      <main style={s.page}>
        <h1 style={s.title}>Join a Game</h1>
        <p style={s.error}>Multiplayer requires a backend connection. Please try again later.</p>
        <button style={s.backBtn} onClick={() => navigate('/')}>Back</button>
      </main>
    );
  }

  return (
    <main style={s.page}>
      <h1 style={s.title}>Join a Game</h1>
      <p style={s.subtitle}>Enter the game code and your name to watch along.</p>

      <div style={s.form}>
        <label style={s.label}>Game Code</label>
        <input
          style={s.input}
          placeholder="e.g. ABC123"
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); if (error) setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          maxLength={8}
          autoFocus={!urlCode}
        />

        <label style={s.label}>Your Name</label>
        <input
          style={s.input}
          placeholder="e.g. Mike"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          maxLength={30}
          autoFocus={!!urlCode}
        />

        {error && <p style={s.error}>{error}</p>}

        <button
          style={{ ...s.joinBtn, opacity: canSubmit ? 1 : 0.5 }}
          onClick={handleJoin}
          disabled={!canSubmit}
        >
          {isLoading ? 'Joining...' : 'Join Game'}
        </button>
      </div>

      <button style={s.backBtn} onClick={() => navigate('/')}>Back</button>
    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', padding: '1.5rem', gap: '1rem', textAlign: 'center' },
  title: { fontSize: '1.5rem', fontWeight: 700, margin: 0 },
  subtitle: { fontSize: '0.9rem', color: '#555', margin: 0, maxWidth: '280px' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', maxWidth: '320px', textAlign: 'left' },
  label: { fontSize: '0.75rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { padding: '0.75rem', fontSize: '1.1rem', fontWeight: 600, border: '2px solid #ccc', borderRadius: '8px', width: '100%', boxSizing: 'border-box' },
  error: { fontSize: '0.8rem', color: '#c62828', fontWeight: 600, margin: 0 },
  joinBtn: { padding: '0.875rem', fontSize: '1rem', fontWeight: 700, background: '#188038', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '0.5rem' },
  backBtn: { padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600, background: 'none', border: 'none', color: '#1a73e8', cursor: 'pointer' },
};
