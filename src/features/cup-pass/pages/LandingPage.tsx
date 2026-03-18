import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <main style={styles.page}>
      <h1 style={styles.title}>T4F Cup Pass</h1>
      <p style={styles.subtitle}>A free social baseball game for fans at the ballpark.</p>
      <button style={styles.button} onClick={() => navigate('/create')}>
        Start a Game
      </button>
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
};
