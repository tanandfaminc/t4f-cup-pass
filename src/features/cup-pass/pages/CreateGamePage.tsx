import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../lib/gameContext';
import { MODES } from '../lib/modes';
import type { GameModeId } from '../types';
import { colors, font, radius, btnPrimary, wordmark } from '../lib/theme';

const MODE_ICONS: Record<GameModeId, string> = {
  cup_pass: '⚾',
  cup_classic: '🪙',
};

export default function CreateGamePage() {
  const navigate = useNavigate();
  const { actions, backendStatus } = useGame();
  const [gameName, setGameName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [selectedMode, setSelectedMode] = useState<GameModeId>('cup_pass');

  async function handleNext() {
    await actions.setGameInfo(gameName.trim(), teamName.trim(), selectedMode);
    navigate('/seat-order');
  }

  const isSaving = backendStatus === 'saving';

  return (
    <main style={s.page}>
      <div style={s.top}>
        <p style={wordmark}>T4F Cup Pass</p>
        <h1 style={s.title}>Create Game</h1>
        <p style={s.hint}>Set up a new cup-passing game for your section.</p>
      </div>

      <div style={s.form}>
        <label style={s.label}>
          Game name
          <input
            style={s.input}
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            placeholder="e.g. Tans Cup Pass"
          />
          <span style={s.optional}>Optional</span>
        </label>

        <label style={s.label}>
          Team playing today
          <input
            style={s.input}
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="e.g. Blue Jays"
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
                    borderColor: active ? colors.primary : colors.border,
                    background: active ? colors.primaryBg : colors.white,
                  }}
                  onClick={() => setSelectedMode(mode.id)}
                  type="button"
                >
                  <span style={s.modeIcon}>{MODE_ICONS[mode.id]}</span>
                  <span style={{ ...s.modeName, color: active ? colors.primary : colors.textPrimary }}>
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
        <button style={{ ...btnPrimary, width: '100%', opacity: isSaving ? 0.6 : 1 }} onClick={handleNext} disabled={isSaving}>
          {isSaving ? 'Creating...' : 'Next: Add Players →'}
        </button>
      </div>
    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', padding: '1.25rem', gap: '1.25rem', minHeight: '100dvh' },
  top: { display: 'flex', flexDirection: 'column', gap: '0.3rem', paddingTop: '0.5rem' },
  title: { fontSize: '1.5rem', fontWeight: 800, color: colors.textPrimary, margin: 0 },
  hint: { fontSize: font.base, color: colors.textSecondary, margin: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 },
  label: { display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: font.base, fontWeight: 600, color: colors.textPrimary, position: 'relative' },
  input: { padding: '0.75rem', fontSize: '1rem', border: `1.5px solid ${colors.border}`, borderRadius: radius.md, width: '100%', background: colors.white },
  optional: { fontSize: font.xs, color: colors.textMuted, fontWeight: 500 },

  modeSection: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  modeHeading: { fontSize: font.base, fontWeight: 600, color: colors.textPrimary, margin: 0 },
  modeGrid: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  modeCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.2rem',
    padding: '0.75rem', borderRadius: radius.md, border: '2px solid',
    cursor: 'pointer', textAlign: 'left', position: 'relative',
    fontFamily: 'inherit',
  },
  modeIcon: { fontSize: '1.25rem', lineHeight: 1 },
  modeName: { fontSize: font.md, fontWeight: 700, margin: 0 },
  modeDesc: { fontSize: font.sm, color: colors.textSecondary, lineHeight: 1.4 },
  modeCheck: { position: 'absolute', top: '0.6rem', right: '0.75rem', fontSize: font.md, color: colors.primary, fontWeight: 700 },

  bottom: { marginTop: 'auto', paddingTop: '0.5rem' },
};
