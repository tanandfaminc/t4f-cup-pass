import type { HitEvent } from '../types';

export const SCORE_MAP: Record<HitEvent, number> = {
  single: 1,
  double: 2,
  triple: 3,
  home_run: 4,
  walk: 1,
  hit_by_pitch: 1,
  out: -1,
  strikeout: -2,
  double_play: -2,
  error: 0,
  sacrifice: 0,
};

export function getEventScore(event: HitEvent): number {
  return SCORE_MAP[event];
}

export function applyScore(current: number, event: HitEvent): number {
  return current + getEventScore(event);
}
