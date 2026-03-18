import { useNavigate } from 'react-router-dom';

export default function StartConfirmPage() {
  const navigate = useNavigate();

  return (
    <main style={styles.page}>
      <h1 style={styles.title}>Ready to Play?</h1>
      <p style={styles.hint}>Review your game setup before the first pitch.</p>
      <div style={styles.summary}>[Game summary — coming soon]</div>
      <button style={styles.button} onClick={() => navigate('/game')}>
        Start Game
      </button>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    padding: '1.5rem',
    gap: '1rem',
    minHeight: '100dvh',
  },
  title: { fontSize: '1.5rem', fontWeight: 700, margin: 0 },
  hint: { fontSize: '0.9rem', color: '#555', margin: 0 },
  summary: {
    flex: 1,
    display: 'flex' as const,
    alignItems: 'center',
    justifyContent: 'center',
    color: '#aaa',
    fontSize: '0.9rem',
    border: '1px dashed #ddd',
    borderRadius: '8px',
    padding: '2rem',
    textAlign: 'center' as const,
  },
  button: {
    padding: '0.875rem',
    fontSize: '1rem',
    fontWeight: 700,
    background: '#188038',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};
