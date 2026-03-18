import { useNavigate } from 'react-router-dom';

export default function EndGamePage() {
  const navigate = useNavigate();

  return (
    <main style={styles.page}>
      <h1 style={styles.title}>Game Over</h1>
      <p style={styles.hint}>Final scores and highlights.</p>

      <div style={styles.results}>[Final results — coming soon]</div>

      <button style={styles.button} onClick={() => navigate('/')}>
        Back to Home
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
    alignItems: 'center',
    textAlign: 'center',
  },
  title: { fontSize: '2rem', fontWeight: 700, margin: 0 },
  hint: { fontSize: '0.9rem', color: '#555', margin: 0 },
  results: {
    flex: 1,
    display: 'flex' as const,
    alignItems: 'center',
    justifyContent: 'center',
    color: '#aaa',
    fontSize: '0.9rem',
    border: '1px dashed #ddd',
    borderRadius: '8px',
    padding: '2rem',
    width: '100%',
    maxWidth: '400px',
  },
  button: {
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
};
