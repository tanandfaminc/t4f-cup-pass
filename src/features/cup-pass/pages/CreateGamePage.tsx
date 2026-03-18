import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../lib/gameContext';
import { colors, font, radius, btnPrimary, wordmark } from '../lib/theme';

export default function CreateGamePage() {
  const navigate = useNavigate();
  const { actions, backendStatus } = useGame();
  const [gameName, setGameName] = useState('');
  const [teamName, setTeamName] = useState('');

  async function handleNext() {
    await actions.setGameInfo(gameName.trim(), teamName.trim());
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
            placeholder="e.g. Row 14 Cup Pass"
          />
          <span style={s.optional}>Optional</span>
        </label>

        <label style={s.label}>
          Team playing today
          <input
            style={s.input}
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="e.g. Cubs"
          />
          <span style={s.optional}>Optional</span>
        </label>
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
  bottom: { marginTop: 'auto', paddingTop: '0.5rem' },
};
