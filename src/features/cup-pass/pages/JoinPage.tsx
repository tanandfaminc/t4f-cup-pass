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
      setError('Game not found. Double-check the code and try again.');
    }
  }

  if (!isBackendConnected) {
    return (
      <main style={s.page}>
        <div style={s.errorCard}>
          <p style={s.errorIcon}>!</p>
          <h2 style={s.errorTitle}>Can't Connect</h2>
          <p style={s.errorMsg}>Multiplayer requires a backend connection. Please check your internet and try again.</p>
        </div>
        <button style={s.backBtn} onClick={() => navigate('/')}>Back to Home</button>
      </main>
    );
  }

  return (
    <main style={s.page}>
      <h1 style={s.title}>Join a Game</h1>
      <p style={s.subtitle}>Enter the game code shared by your host and pick a display name.</p>

      <div style={s.form}>
        <label style={s.label}>Game Code</label>
        <input
          style={{ ...s.input, borderColor: error ? '#c62828' : '#ccc' }}
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

        {error && (
          <div style={s.errorBanner}>
            <p style={s.errorText}>{error}</p>
          </div>
        )}

        <button
          style={{ ...s.joinBtn, opacity: canSubmit ? 1 : 0.5 }}
          onClick={handleJoin}
          disabled={!canSubmit}
        >
          {isLoading ? 'Looking for game...' : 'Join Game'}
        </button>
      </div>

      <button style={s.backBtn} onClick={() => navigate('/')}>Back</button>
    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', padding: '1.5rem', gap: '1rem', textAlign: 'center' },
  title: { fontSize: '1.5rem', fontWeight: 700, margin: 0 },
  subtitle: { fontSize: '0.85rem', color: '#666', margin: 0, maxWidth: '300px', lineHeight: 1.5 },
  form: { display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', maxWidth: '320px', textAlign: 'left' },
  label: { fontSize: '0.75rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { padding: '0.75rem', fontSize: '1.1rem', fontWeight: 600, border: '2px solid #ccc', borderRadius: '8px', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.15s' },
  errorBanner: { background: '#fbe9e7', border: '1px solid #ef9a9a', borderRadius: '8px', padding: '0.6rem 0.75rem' },
  errorText: { fontSize: '0.8rem', color: '#c62828', fontWeight: 600, margin: 0 },
  joinBtn: { padding: '0.875rem', fontSize: '1rem', fontWeight: 700, background: '#188038', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '0.5rem', transition: 'opacity 0.15s' },
  backBtn: { padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600, background: 'none', border: 'none', color: '#1a73e8', cursor: 'pointer' },
  errorCard: { background: '#fbe9e7', borderRadius: '14px', padding: '1.5rem', textAlign: 'center', maxWidth: '320px', width: '100%' },
  errorIcon: { width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: '#c62828', color: '#fff', fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' },
  errorTitle: { fontSize: '1.1rem', fontWeight: 700, color: '#c62828', margin: '0 0 0.5rem' },
  errorMsg: { fontSize: '0.85rem', color: '#555', margin: 0, lineHeight: 1.5 },
};
