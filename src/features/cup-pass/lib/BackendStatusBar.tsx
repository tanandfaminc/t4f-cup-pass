import { useGame } from './gameContext';
import { colors, font, radius } from './theme';

export default function BackendStatusBar() {
  const { backendStatus, backendError, clearBackendError, isBackendConnected } = useGame();

  if (!isBackendConnected) return null;

  if (backendError) {
    // Log full error for developers
    if (import.meta.env.DEV) console.warn('[BackendStatusBar]', backendError);

    return (
      <div style={s.notice}>
        <span style={s.noticeIcon}>☁</span>
        <span style={s.noticeText}>Cloud save unavailable. Playing in local mode.</span>
        <button style={s.dismiss} onClick={clearBackendError} aria-label="Dismiss">✕</button>
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
    background: colors.primary,
    color: colors.white,
    padding: '0.25rem 1rem',
    fontSize: font.sm,
    fontWeight: 600,
    textAlign: 'center',
    zIndex: 1000,
  },
  barText: { opacity: 0.9 },
  notice: {
    position: 'fixed',
    top: '0.5rem',
    left: '0.75rem',
    right: '0.75rem',
    background: colors.warningBg,
    color: colors.warning,
    padding: '0.4rem 0.75rem',
    fontSize: font.sm,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    borderRadius: radius.sm,
    border: `1px solid ${colors.warning}33`,
    zIndex: 1000,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  noticeIcon: { fontSize: '0.9rem', flexShrink: 0 },
  noticeText: { flex: 1, lineHeight: 1.3 },
  dismiss: {
    background: 'none',
    border: 'none',
    color: colors.warning,
    fontSize: '0.85rem',
    cursor: 'pointer',
    padding: '0.1rem 0.25rem',
    flexShrink: 0,
    opacity: 0.7,
  },
};
