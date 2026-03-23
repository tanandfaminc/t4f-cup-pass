import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../lib/gameContext';
import { rankPlayers } from '../lib/gameLogic';
import { getMode } from '../lib/modes';
import { track } from '../lib/analytics';
import { colors, font, radius, btnBase, headerBar } from '../lib/theme';

function scoreDisplay(score: number): string {
  return score > 0 ? `+${score}` : `${score}`;
}

type FeedbackOption = {
  label: string;
  value: string;
};

type InterestOption = {
  label: string;
  value: string;
};

const FEEDBACK_OPTIONS: FeedbackOption[] = [
  { label: 'Loved it', value: 'loved_it' },
  { label: 'It was good', value: 'it_was_good' },
  { label: 'Needs work', value: 'needs_work' },
];

const INTEREST_OPTIONS: InterestOption[] = [
  { label: 'Get last-minute ticket deals', value: 'last_minute_deals' },
  { label: 'Find tickets for future games', value: 'future_games' },
  { label: 'Sell my tickets on Tickets 4 Fans', value: 'sell_tickets' },
  { label: 'Keep me posted on Cup Pass updates', value: 'cup_pass_updates' },
];

const MAIN_SITE_BASE = (import.meta.env.VITE_T4F_MAIN_SITE_URL as string | undefined) ?? 'https://tickets4fans.ca';

export default function EndGamePage() {
  const navigate = useNavigate();
  const { state, actions } = useGame();
  const ranked = rankPlayers(state);
  const game = state.game!;
  const mode = getMode(state.mode);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [interest, setInterest] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowModal(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const winner = ranked[0];

  async function handleRematch() {
    await actions.rematch();
    navigate('/game');
  }

  function handleNewGame() {
    actions.reset();
    navigate('/create');
  }

  const buildShareText = useCallback(() => {
    const modeTag = mode.id === 'cup_classic' ? ' (Cup Classic)' : '';
    const lines = [
      `T4F Cup Pass — ${state.gameName || 'Game Over'}${modeTag}`,
      '',
      ...ranked.map((p, i) => {
        const rank = i === 0 ? '1st' : i === 1 ? '2nd' : i === 2 ? '3rd' : `${i + 1}th`;
        const scoreStr = mode.id === 'cup_classic'
          ? `${p.score} ${mode.scoreUnitPlural}`
          : scoreDisplay(p.score);
        return `${rank} ${p.name}: ${scoreStr}`;
      }),
      '',
      `${game.history.length} plays over ${game.inning} inning${game.inning !== 1 ? 's' : ''}`,
    ];
    return lines.join('\n');
  }, [state.gameName, ranked, game.history.length, game.inning, mode]);

  const handleShare = useCallback(() => {
    const text = buildShareText();
    if (navigator.share) {
      navigator.share({ title: 'T4F Cup Pass Results', text });
      track('share_clicked', { share_method: 'native' });
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
      track('share_clicked', { share_method: 'clipboard' });
    }
  }, [buildShareText]);

  const handleFeedbackSelected = useCallback((value: string) => {
    setFeedback(value);
    track('post_game_feedback_selected', { feedback: value });
  }, []);

  const handleInterestSelected = useCallback((value: string) => {
    setInterest(value);
    track('post_game_interest_selected', { interest: value });
  }, []);

  const buildHandoffUrl = useCallback(() => {
    const params = new URLSearchParams({
      source: 'cup_pass',
      completed: 'true',
      mode: mode.id,
    });

    if (feedback) params.set('feedback', feedback);
    if (interest) params.set('interest', interest);

    return `${MAIN_SITE_BASE}/cup-pass/connect?${params.toString()}`;
  }, [feedback, interest, mode.id]);

  const handleContinueToMainSite = useCallback(() => {
    if (!interest) return;
    const destination = buildHandoffUrl();
    track('post_game_handoff_clicked', { destination, interest, feedback: feedback ?? 'not_provided' });
    window.location.assign(destination);
  }, [buildHandoffUrl, feedback, interest]);

  const handleSkipHandoff = useCallback(() => {
    track('post_game_handoff_skipped', {
      step: interest ? 'cta' : feedback ? 'interest' : 'feedback',
      feedback: feedback ?? 'not_provided',
      interest: interest ?? 'not_provided',
    });
    setShowModal(false);
  }, [feedback, interest]);

  const isClassic = mode.id === 'cup_classic';

  return (
    <main style={s.page}>
      {/* Branded header */}
      <header style={headerBar}>
        <span style={{ fontSize: '1.1rem' }}>🏆</span>
        <span style={s.headerBrand}>Game Over</span>
      </header>

      <div style={s.content}>
        {state.gameName && <p style={s.gameName}>{state.gameName}</p>}
        {isClassic && (
          <p style={s.modeBadge}>🪙 Coin Mode · No cash, just bragging rights</p>
        )}

        {/* Winner highlight */}
        {winner && (
          <section style={s.winnerCard}>
            <p style={s.winnerLabel}>{isClassic ? 'MOST COINS' : 'WINNER'}</p>
            <p style={s.winnerName}>{winner.name}</p>
            <p style={s.winnerScore}>
              {isClassic ? `🪙 ${winner.score} ${mode.scoreUnitPlural}` : scoreDisplay(winner.score)}
            </p>
          </section>
        )}

        {/* Stats bar */}
        <div style={s.statsRow}>
          <div style={s.statBox}>
            <span style={s.statValue}>{game.history.length}</span>
            <span style={s.statLabel}>plays</span>
          </div>
          <div style={s.statBox}>
            <span style={s.statValue}>{game.inning}</span>
            <span style={s.statLabel}>inning{game.inning !== 1 ? 's' : ''}</span>
          </div>
          <div style={s.statBox}>
            <span style={s.statValue}>{ranked.length}</span>
            <span style={s.statLabel}>players</span>
          </div>
        </div>

        {/* Final standings */}
        <section style={s.standingsCard}>
          <p style={s.standingsTitle}>
            {isClassic ? '🪙 Final Coin Totals' : 'Final Standings'}
          </p>
          <ol style={s.list}>
            {ranked.map((p, i) => (
              <li key={p.id} style={{
                ...s.item,
                background: i === 0 ? colors.goldBg : i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                borderLeft: i === 0 ? `4px solid ${colors.gold}` : '4px solid transparent',
              }}>
                <span style={{ ...s.rank, color: i === 0 ? colors.gold : colors.textMuted }}>
                  {i === 0 ? '1st' : i === 1 ? '2nd' : i === 2 ? '3rd' : `${i + 1}th`}
                </span>
                <span style={{ ...s.name, color: i === 0 ? colors.gold : colors.textPrimary }}>{p.name}</span>
                {p.seat && <span style={s.seat}>{p.seat}</span>}
                <span style={{ ...s.score, color: p.score > 0 ? colors.positive : p.score < 0 ? colors.negative : colors.textSecondary }}>
                  {isClassic ? `🪙 ${p.score}` : scoreDisplay(p.score)}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* Share */}
        <button style={s.shareBtn} onClick={handleShare}>
          {copied ? 'Copied to clipboard!' : 'Share Results'}
        </button>

        {/* Actions */}
        <div style={s.actions}>
          <button style={s.rematchBtn} onClick={handleRematch}>
            Rematch — Same Players
          </button>
          <button style={s.newGameBtn} onClick={handleNewGame}>
            New Game
          </button>
        </div>
      </div>

      {/* Tickets 4 Fans handoff modal */}
      {showModal && (
        <div style={s.modalOverlay} onClick={handleSkipHandoff}>
          <div style={s.modalSheet} onClick={(e) => e.stopPropagation()}>
            <p style={s.handoffTitle}>Continue on Tickets 4 Fans</p>

            {!feedback && (
              <>
                <p style={s.handoffPrompt}>Did you like Cup Pass?</p>
                <div style={s.optionList}>
                  {FEEDBACK_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      style={s.optionBtn}
                      onClick={() => handleFeedbackSelected(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {feedback && !interest && (
              <>
                <p style={s.handoffPrompt}>What do you want from Tickets 4 Fans?</p>
                <div style={s.optionList}>
                  {INTEREST_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      style={s.optionBtn}
                      onClick={() => handleInterestSelected(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {interest && (
              <>
                <p style={s.handoffPrompt}>Ready to continue?</p>
                <button style={s.continueBtn} onClick={handleContinueToMainSite}>
                  Continue to Tickets 4 Fans
                </button>
              </>
            )}

            <button style={s.skipBtn} onClick={handleSkipHandoff}>
              Skip / No thanks
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex', flexDirection: 'column', minHeight: '100dvh',
    background: `linear-gradient(180deg, #0a1628 0%, #0f2a4a 40%, #0a1628 100%)`,
  },
  content: { display: 'flex', flexDirection: 'column', padding: '1rem', gap: '0.75rem', flex: 1 },
  headerBrand: { fontSize: font.md, fontWeight: 800, color: colors.white, textTransform: 'uppercase', letterSpacing: '0.06em' },
  gameName: { fontSize: font.md, color: colors.textSecondary, margin: 0, fontWeight: 500, textAlign: 'center' },
  modeBadge: { fontSize: font.sm, color: colors.textMuted, margin: 0, fontStyle: 'italic', textAlign: 'center' },

  winnerCard: {
    background: `linear-gradient(135deg, #0f2a4a, ${colors.primaryLight}, #0f2a4a)`,
    border: `2px solid ${colors.gold}`,
    borderRadius: radius.xl, padding: '1.5rem 1rem', textAlign: 'center',
    boxShadow: `0 0 20px rgba(245, 158, 11, 0.2)`,
  },
  winnerLabel: {
    fontSize: font.xs, fontWeight: 800, color: colors.gold, textTransform: 'uppercase',
    letterSpacing: '0.15em', margin: '0 0 0.3rem',
  },
  winnerName: { fontSize: font.hero, fontWeight: 900, margin: '0 0 0.1rem', color: colors.white },
  winnerScore: { fontSize: font.xl, fontWeight: 700, margin: 0, color: colors.positive },

  statsRow: { display: 'flex', justifyContent: 'center', gap: '1.5rem', padding: '0.25rem 0' },
  statBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.1rem' },
  statValue: { fontSize: font.lg, fontWeight: 800, color: colors.white },
  statLabel: { fontSize: font.xs, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' },

  standingsCard: {
    background: colors.surface, borderRadius: radius.lg, padding: '0.75rem',
    border: `1px solid ${colors.border}`,
  },
  standingsTitle: { fontSize: font.xs, fontWeight: 700, color: colors.gold, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.5rem', paddingLeft: '0.25rem' },
  list: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  item: { display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 0.75rem', borderRadius: radius.sm },
  rank: { fontSize: font.sm, fontWeight: 700, minWidth: '2rem' },
  name: { flex: 1, fontSize: font.md, fontWeight: 700 },
  seat: { fontSize: font.sm, color: colors.textMuted },
  score: { fontSize: font.lg, fontWeight: 700 },

  shareBtn: {
    ...btnBase, padding: '0.75rem', fontSize: font.md,
    background: `linear-gradient(135deg, ${colors.positive}, ${colors.positiveDark})`,
    color: colors.white, borderRadius: radius.md,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  },
  handoffCard: {
    background: colors.surface,
    borderRadius: radius.lg,
    padding: '0.875rem',
    border: `1px solid ${colors.border}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },
  handoffTitle: {
    margin: 0,
    fontSize: font.sm,
    fontWeight: 700,
    color: colors.gold,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  handoffPrompt: {
    margin: 0,
    color: colors.textPrimary,
    fontSize: font.md,
    fontWeight: 600,
  },
  optionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.45rem',
  },
  optionBtn: {
    ...btnBase,
    borderRadius: radius.md,
    background: colors.surfaceLight,
    color: colors.textPrimary,
    border: `1px solid ${colors.border}`,
    textAlign: 'left',
    padding: '0.7rem 0.75rem',
    fontSize: font.sm,
    fontWeight: 600,
  },
  continueBtn: {
    ...btnBase,
    padding: '0.8rem',
    fontSize: font.md,
    background: `linear-gradient(135deg, ${colors.primaryLight}, ${colors.primary})`,
    color: colors.white,
    borderRadius: radius.md,
    border: `1px solid ${colors.borderCyan}`,
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.65)',
    display: 'flex',
    alignItems: 'flex-end',
    zIndex: 100,
  },
  modalSheet: {
    background: `linear-gradient(180deg, #0f2a4a 0%, #0a1628 100%)`,
    border: `1px solid ${colors.border}`,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: '1.5rem 1rem 2rem',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  skipBtn: {
    ...btnBase,
    background: 'none',
    color: colors.textMuted,
    fontSize: font.sm,
    textDecoration: 'underline',
    textUnderlineOffset: '0.2rem',
    alignSelf: 'flex-start',
    padding: '0.25rem 0',
  },

  actions: { marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.25rem' },
  rematchBtn: {
    ...btnBase, padding: '0.875rem', fontSize: '1rem',
    background: `linear-gradient(135deg, ${colors.primaryLight}, ${colors.primary})`,
    color: colors.white, borderRadius: radius.md,
    border: `1px solid ${colors.borderCyan}`,
  },
  newGameBtn: {
    ...btnBase, padding: '0.75rem', fontSize: font.md,
    background: 'none', border: `2px solid ${colors.borderLight}`, color: colors.textSecondary, borderRadius: radius.md,
  },
};
