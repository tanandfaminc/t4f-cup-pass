import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../lib/gameContext';
import { track } from '../lib/analytics';
import { colors, font, radius, btnBase } from '../lib/theme';

export default function LandingPage() {
  const navigate = useNavigate();
  const { actions, isBackendConnected, backendStatus } = useGame();
  const [showJoin, setShowJoin] = useState(false);
  const [code, setCode] = useState('');
  const [joinError, setJoinError] = useState('');

  useEffect(() => { track('landing_viewed'); }, []);

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
    <main style={s.page}>
      {/* T4F Branding */}
      <div style={s.brand}>
        <img src="/logo.png" alt="T4F Cup Pass" style={s.logoImg} />
        <div style={s.brandBadge}>
          <span style={s.brandT4f}>Tickets 4 Fans</span>
          <span style={s.brandCup}>Cup Pass</span>
        </div>
      </div>

      <p style={s.subtitle}>A fun baseball game for fans at the ballpark!</p>

      <div style={s.actions}>
        <button style={s.primaryBtn} onClick={() => navigate('/create')}>
          Start a Game
        </button>

        {isBackendConnected && (
          <>
            <button style={s.joinBtn} onClick={() => navigate('/join')}>
              Join a Game
            </button>

            <button style={s.linkBtn} onClick={() => setShowJoin(!showJoin)}>
              {showJoin ? 'Cancel' : 'Resume a Game'}
            </button>

            {showJoin && (
              <div style={s.joinBox}>
                <input
                  style={s.codeInput}
                  placeholder="Enter game code"
                  value={code}
                  onChange={(e) => { setCode(e.target.value); if (joinError) setJoinError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  maxLength={8}
                />
                <button
                  style={{ ...s.goBtn, opacity: isLoading ? 0.6 : 1 }}
                  onClick={handleJoin}
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'Go'}
                </button>
                {joinError && <p style={s.joinError}>{joinError}</p>}
              </div>
            )}
          </>
        )}
      </div>

      <p style={s.footer}>Free to play. No bets. No MLB data.</p>
    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    minHeight: '100dvh', padding: '1.5rem', gap: '1rem', textAlign: 'center',
    background: `linear-gradient(180deg, #0a1628 0%, #0f2a4a 40%, #0a1628 100%)`,
  },
  brand: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' },
  logoImg: { width: '160px', height: 'auto', display: 'block', filter: 'drop-shadow(0 4px 12px rgba(0, 212, 255, 0.3))' },
  brandBadge: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.1rem' },
  brandT4f: { fontSize: font.xs, fontWeight: 800, color: colors.gold, textTransform: 'uppercase', letterSpacing: '0.15em' },
  brandCup: { fontSize: font.lg, fontWeight: 900, color: colors.cyan, textTransform: 'uppercase', letterSpacing: '0.1em' },
  subtitle: { fontSize: font.md, color: colors.textSecondary, margin: 0, maxWidth: '280px' },

  actions: { display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%', maxWidth: '320px', marginTop: '0.5rem' },
  primaryBtn: {
    ...btnBase, width: '100%', padding: '0.95rem', fontSize: '1.05rem',
    background: `linear-gradient(135deg, ${colors.primaryLight}, ${colors.primary})`,
    color: colors.white, border: `1px solid ${colors.borderCyan}`,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
  },
  joinBtn: {
    ...btnBase, padding: '0.85rem', fontSize: font.md, width: '100%',
    background: `linear-gradient(135deg, ${colors.positive}, ${colors.positiveDark})`,
    color: colors.white, borderRadius: radius.md,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  },
  linkBtn: { ...btnBase, padding: '0.5rem', fontSize: font.base, background: 'none', color: colors.textSecondary },

  joinBox: { display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', alignItems: 'center' },
  codeInput: {
    padding: '0.75rem', fontSize: '1.25rem', textAlign: 'center', letterSpacing: '0.15em',
    fontWeight: 700, border: `2px solid ${colors.borderCyan}`, borderRadius: radius.md,
    width: '100%', textTransform: 'uppercase', fontFamily: 'inherit',
    background: colors.surface, color: colors.white,
  },
  goBtn: {
    ...btnBase, padding: '0.6rem 2rem', fontSize: font.md,
    background: `linear-gradient(135deg, ${colors.positive}, ${colors.positiveDark})`,
    color: colors.white, borderRadius: radius.md,
  },
  joinError: { fontSize: font.sm, color: colors.negative, fontWeight: 600, margin: 0 },

  footer: { fontSize: font.xs, color: colors.textMuted, marginTop: 'auto', paddingTop: '1rem' },
};
