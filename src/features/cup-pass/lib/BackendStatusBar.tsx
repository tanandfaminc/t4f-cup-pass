import { useGame } from './gameContext';

export default function BackendStatusBar() {
  const { backendStatus, backendError, clearBackendError, isBackendConnected } = useGame();

  if (!isBackendConnected) return null;

  if (backendError) {
    return (
      <div style={s.error}>
        <span style={s.errorText}>Backend error: {backendError}</span>
        <button style={s.dismiss} onClick={clearBackendError}>✕</button>
      </div>
    );
  }

  if (backendStatus === 'saving' || backendStatus === 'loading') {
    return (
      <div style={s.bar}>
        <span style={s.barText}>
          {backendStatus === 'saving' ? 'Saving...' : 'Loading...'}
        </span>
      </div>
    );
  }

  return null;
}

const s: Record<string, React.CSSProperties> = {
  bar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    background: '#1a73e8',
    color: '#fff',
    padding: '0.3rem 1rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    textAlign: 'center',
    zIndex: 1000,
  },
  barText: { opacity: 0.9 },
  error: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    background: '#c62828',
    color: '#fff',
    padding: '0.4rem 1rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1000,
  },
  errorText: { flex: 1 },
  dismiss: {
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: '1rem',
    cursor: 'pointer',
    padding: '0 0.25rem',
  },
};
