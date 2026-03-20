/**
 * Analytics abstraction layer for Cup Pass.
 *
 * Logs events to console in development. Swap the `send` implementation
 * for a real provider (Mixpanel, Amplitude, PostHog, etc.) when ready.
 */

// ---- Event definitions ----

export type AnalyticsEvent =
  | 'landing_viewed'
  | 'game_create_started'
  | 'game_created'
  | 'game_started'
  | 'player_joined'
  | 'result_submitted'
  | 'result_undone'
  | 'game_paused'
  | 'game_resumed'
  | 'game_completed'
  | 'rematch_started'
  | 'share_clicked'
  | 'post_game_feedback_selected'
  | 'post_game_interest_selected'
  | 'post_game_handoff_clicked'
  | 'post_game_handoff_skipped';

export interface AnalyticsProperties {
  player_count?: number;
  mode?: string;
  length_type?: string;
  event_count?: number;
  completion_time_seconds?: number;
  joined_as_role?: 'host' | 'player';
  result_type?: string;
  score_delta?: number;
  game_code?: string;
  share_method?: 'native' | 'clipboard';
  [key: string]: string | number | boolean | undefined;
}

// ---- Provider interface ----

interface AnalyticsProvider {
  track: (event: AnalyticsEvent, properties?: AnalyticsProperties) => void;
}

// ---- Console provider (default) ----

const consoleProvider: AnalyticsProvider = {
  track: (event, properties) => {
    if (import.meta.env.DEV) {
      console.log(
        `%c[analytics] %c${event}`,
        'color: #1a73e8; font-weight: bold',
        'color: #333; font-weight: 600',
        properties ?? '',
      );
    }
  },
};

// ---- Singleton ----

let provider: AnalyticsProvider = consoleProvider;

/**
 * Replace the default console provider with a real analytics SDK.
 * Call this once at app startup if you have a provider configured.
 */
export function setAnalyticsProvider(p: AnalyticsProvider) {
  provider = p;
}

/**
 * Track an analytics event with optional properties.
 */
export function track(event: AnalyticsEvent, properties?: AnalyticsProperties) {
  try {
    provider.track(event, properties);
  } catch {
    // Analytics should never break the app
  }
}
