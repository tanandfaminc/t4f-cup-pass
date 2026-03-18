import { useNavigate } from 'react-router-dom';

export default function SeatOrderPage() {
  const navigate = useNavigate();

  return (
    <main style={styles.page}>
      <h1 style={styles.title}>Seat Order</h1>
      <p style={styles.hint}>Arrange players in seat order for the cup pass.</p>
      <p style={styles.placeholder}>[Player/seat list — coming soon]</p>
      <button style={styles.button} onClick={() => navigate('/start')}>
        Next: Confirm & Start
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
  placeholder: {
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
    fontWeight: 600,
    background: '#1a73e8',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};
