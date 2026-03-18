import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../lib/gameContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { actions, isBackendConnected, backendStatus } = useGame();
  const [showJoin, setShowJoin] = useState(false);
  const [code, setCode] = useState('');
  const [joinError, setJoinError] = useState('');

  async function handleJoin() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setJoinError('');
    const ok = await actions.loadGameByCode(trimmed);
    if (ok) {
      navigate('/game');
    } else {
      setJoinError('Game not found. Check the code and try again.');
    }
  }

  const isLoading = backendStatus === 'loading';

  return (
    <main style={styles.page}>
      <h1 style={styles.title}>T4F Cup Pass</h1>
      <p style={styles.subtitle}>A free social baseball game for fans at the ballpark.</p>
      <button style={styles.button} onClick={() => navigate('/create')}>
        Start a Game
      </button>

      {isBackendConnected && (
        <>
          <button style={styles.joinToggle} onClick={() => setShowJoin(!showJoin)}>
            {showJoin ? 'Cancel' : 'Resume a Game'}
          </button>

          {showJoin && (
            <div style={styles.joinBox}>
              <input
                style={styles.codeInput}
                placeholder="Enter game code"
                value={code}
                onChange={(e) => { setCode(e.target.value); if (joinError) setJoinError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                maxLength={8}
              />
              <button
                style={{ ...styles.joinBtn, opacity: isLoading ? 0.6 : 1 }}
                onClick={handleJoin}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Go'}
              </button>
              {joinError && <p style={styles.joinError}>{joinError}</p>}
            </div>
          )}
        </>
      )}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100dvh',
    padding: '1.5rem',
    gap: '1rem',
    textAlign: 'center',
  },
  title: { fontSize: '2rem', fontWeight: 700, margin: 0 },
  subtitle: { fontSize: '1rem', color: '#555', margin: 0, maxWidth: '280px' },
  button: {
    marginTop: '1rem',
    padding: '0.875rem 2rem',
    fontSize: '1rem',
    fontWeight: 600,
    background: '#1a73e8',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    width: '100%',
    maxWidth: '320px',
  },
  joinToggle: {
    padding: '0.5rem 1rem',
    fontSize: '0.85rem',
    fontWeight: 600,
    background: 'none',
    border: 'none',
    color: '#1a73e8',
    cursor: 'pointer',
  },
  joinBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    width: '100%',
    maxWidth: '320px',
    alignItems: 'center',
  },
  codeInput: {
    padding: '0.75rem',
    fontSize: '1.25rem',
    textAlign: 'center',
    letterSpacing: '0.15em',
    fontWeight: 700,
    border: '2px solid #ccc',
    borderRadius: '8px',
    width: '100%',
    textTransform: 'uppercase',
  },
  joinBtn: {
    padding: '0.6rem 2rem',
    fontSize: '0.95rem',
    fontWeight: 700,
    background: '#188038',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  joinError: {
    fontSize: '0.8rem',
    color: '#c62828',
    fontWeight: 600,
    margin: 0,
  },
};
