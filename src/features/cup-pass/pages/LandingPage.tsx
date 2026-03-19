import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../lib/gameContext';
import { track } from '../lib/analytics';
import { colors, font, radius, btnBase, btnPrimary } from '../lib/theme';

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
        <p style={s.tagline}>Tickets 4 Fans</p>
      </div>

      <p style={s.subtitle}>A free social baseball game for fans at the ballpark.</p>

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
    minHeight: '100dvh', padding: '1.5rem', gap: '0.75rem', textAlign: 'center',
  },
  brand: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' },
  logoImg: { width: '160px', height: 'auto', display: 'block' },
  tagline: { fontSize: font.xs, fontWeight: 700, color: colors.accent, textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0 },
  subtitle: { fontSize: font.md, color: colors.textSecondary, margin: 0, maxWidth: '280px' },

  actions: { display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%', maxWidth: '320px', marginTop: '0.5rem' },
  primaryBtn: { ...btnPrimary, width: '100%' },
  joinBtn: { ...btnBase, padding: '0.75rem', fontSize: font.md, background: colors.positive, color: colors.white, borderRadius: radius.md, width: '100%' },
  linkBtn: { ...btnBase, padding: '0.5rem', fontSize: font.base, background: 'none', color: colors.primary },

  joinBox: { display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', alignItems: 'center' },
  codeInput: {
    padding: '0.75rem', fontSize: '1.25rem', textAlign: 'center', letterSpacing: '0.15em',
    fontWeight: 700, border: `2px solid ${colors.border}`, borderRadius: radius.md,
    width: '100%', textTransform: 'uppercase', fontFamily: 'inherit',
  },
  goBtn: { ...btnBase, padding: '0.6rem 2rem', fontSize: font.md, background: colors.positive, color: colors.white, borderRadius: radius.md },
  joinError: { fontSize: font.sm, color: colors.negative, fontWeight: 600, margin: 0 },

  footer: { fontSize: font.xs, color: colors.textMuted, marginTop: 'auto', paddingTop: '1rem' },
};
