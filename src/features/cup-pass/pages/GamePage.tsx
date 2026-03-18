import { useNavigate } from 'react-router-dom';

export default function GamePage() {
  const navigate = useNavigate();

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <span style={styles.inning}>Inning 1</span>
        <h1 style={styles.title}>Host Game</h1>
      </header>

      <section style={styles.scoreboard}>
        [Scoreboard — coming soon]
      </section>

      <section style={styles.controls}>
        [Play controls — coming soon]
      </section>

      <button style={styles.endButton} onClick={() => navigate('/end')}>
        End Game
      </button>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    padding: '1rem',
    gap: '1rem',
    minHeight: '100dvh',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: '1.25rem', fontWeight: 700, margin: 0 },
  inning: { fontSize: '0.85rem', color: '#555', fontWeight: 600 },
  scoreboard: {
    flex: 1,
    display: 'flex' as const,
    alignItems: 'center',
    justifyContent: 'center',
    color: '#aaa',
    fontSize: '0.9rem',
    border: '1px dashed #ddd',
    borderRadius: '8px',
    padding: '1.5rem',
    textAlign: 'center' as const,
  },
  controls: {
    display: 'flex' as const,
    alignItems: 'center',
    justifyContent: 'center',
    color: '#aaa',
    fontSize: '0.9rem',
    border: '1px dashed #ddd',
    borderRadius: '8px',
    padding: '1.5rem',
    minHeight: '160px',
    textAlign: 'center' as const,
  },
  endButton: {
    padding: '0.75rem',
    fontSize: '0.9rem',
    fontWeight: 600,
    background: '#c62828',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};
