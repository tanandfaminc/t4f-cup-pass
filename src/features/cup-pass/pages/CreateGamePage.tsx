import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../lib/gameContext';
import { MODES } from '../lib/modes';
import type { GameModeId } from '../types';
import { colors, font, radius, btnBase, headerBar } from '../lib/theme';

const MODE_ICONS: Record<GameModeId, string> = {
  cup_pass: '⚾',
  cup_classic: '🪙',
};

export default function CreateGamePage() {
  const navigate = useNavigate();
  const { state, actions, backendStatus } = useGame();
  const [gameName, setGameName] = useState(state.gameName ?? '');
  const [selectedMode, setSelectedMode] = useState<GameModeId>(state.mode ?? 'cup_pass');

  async function handleNext() {
    await actions.setGameInfo(gameName.trim(), '', selectedMode);
    navigate('/seat-order');
  }

  const isSaving = backendStatus === 'saving';

  return (
    <main style={s.page}>
      {/* Branded header */}
      <header style={headerBar}>
        <button style={s.navBack} onClick={() => navigate('/')}>‹</button>
        <span style={{ fontSize: '1.1rem' }}>🏆</span>
        <span style={s.headerTitle}>Create Game</span>
      </header>

      <div style={s.content}>
        <div style={s.form}>
          <label style={s.label}>
            Game Name
            <input
              style={s.input}
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              placeholder="e.g. Tans Cup Pass"
            />
            <span style={s.optional}>Optional</span>
          </label>

          {/* Mode selection */}
          <div style={s.modeSection}>
            <p style={s.modeHeading}>Game Mode</p>
            <div style={s.modeGrid}>
              {(Object.values(MODES) as typeof MODES[GameModeId][]).map((mode) => {
                const active = selectedMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    style={{
                      ...s.modeCard,
                      borderColor: active ? colors.cyan : colors.border,
                      background: active ? 'rgba(0, 212, 255, 0.08)' : colors.surface,
                      boxShadow: active ? `0 0 12px rgba(0, 212, 255, 0.15)` : 'none',
                    }}
                    onClick={() => setSelectedMode(mode.id)}
                    type="button"
                  >
                    <span style={s.modeIcon}>{MODE_ICONS[mode.id]}</span>
                    <span style={{ ...s.modeName, color: active ? colors.cyan : colors.textPrimary }}>
                      {mode.name}
                    </span>
                    <span style={s.modeDesc}>{mode.description}</span>
                    {active && <span style={s.modeCheck}>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div style={s.bottom}>
          <button
            style={{ ...s.nextBtn, opacity: isSaving ? 0.6 : 1 }}
            onClick={handleNext}
            disabled={isSaving}
          >
            {isSaving ? 'Creating...' : 'Next: Add Players →'}
          </button>
        </div>
      </div>
    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex', flexDirection: 'column', minHeight: '100dvh',
    background: `linear-gradient(180deg, #0a1628 0%, #0f2a4a 40%, #0a1628 100%)`,
  },
  navBack: {
    ...btnBase, fontSize: '1.5rem', padding: '0.25rem 0.5rem', background: 'none',
    color: colors.textSecondary, lineHeight: 1, position: 'absolute', left: '0.5rem',
  },
  headerTitle: { fontSize: font.md, fontWeight: 800, color: colors.white, textTransform: 'uppercase', letterSpacing: '0.06em' },
  content: { display: 'flex', flexDirection: 'column', padding: '1.25rem', gap: '1.25rem', flex: 1 },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 },
  label: { display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: font.base, fontWeight: 600, color: colors.textPrimary, position: 'relative' },
  input: {
    padding: '0.75rem', fontSize: '1rem', border: `1.5px solid ${colors.borderCyan}`,
    borderRadius: radius.md, width: '100%', background: colors.surface, color: colors.white,
  },
  optional: { fontSize: font.xs, color: colors.textMuted, fontWeight: 500 },

  modeSection: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  modeHeading: { fontSize: font.base, fontWeight: 600, color: colors.textPrimary, margin: 0 },
  modeGrid: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  modeCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.2rem',
    padding: '0.75rem', borderRadius: radius.md, border: '2px solid',
    cursor: 'pointer', textAlign: 'left', position: 'relative',
    fontFamily: 'inherit', transition: 'all 0.15s',
  },
  modeIcon: { fontSize: '1.25rem', lineHeight: 1 },
  modeName: { fontSize: font.md, fontWeight: 700, margin: 0 },
  modeDesc: { fontSize: font.sm, color: colors.textSecondary, lineHeight: 1.4 },
  modeCheck: { position: 'absolute', top: '0.6rem', right: '0.75rem', fontSize: font.md, color: colors.cyan, fontWeight: 700 },

  bottom: { marginTop: 'auto', paddingTop: '0.5rem' },
  nextBtn: {
    ...btnBase, width: '100%', padding: '0.875rem', fontSize: '1rem',
    background: `linear-gradient(135deg, ${colors.primaryLight}, ${colors.primary})`,
    color: colors.white, border: `1px solid ${colors.borderCyan}`,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  },
};
