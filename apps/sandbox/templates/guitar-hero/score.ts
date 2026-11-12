import type { MediaTextCue } from '@videojs/react';

import type { Lane, Note } from './song';

export type NoteCue = MediaTextCue<Note>;

export interface Score {
  score: number;
  combo: number;
  maxCombo: number;
  hits: ReadonlySet<NoteCue>;
  /** What last happened on each lane, and when, which keys its flash so each one replays. */
  flashes: Partial<Record<Lane, { kind: 'hit' | 'miss'; at: number }>>;
  banner: { text: string; at: number } | null;
}

export type ScoreEvent =
  | { type: 'hit'; cue: NoteCue; lane: Lane; starPower: boolean; at: number }
  | { type: 'miss'; lane: Lane; at: number }
  | { type: 'sustain'; length: number }
  | { type: 'banner'; text: string; at: number };

export const NEW_SCORE: Score = { score: 0, combo: 0, maxCombo: 0, hits: new Set(), flashes: {}, banner: null };

export function score(state: Score, event: ScoreEvent): Score {
  switch (event.type) {
    case 'hit': {
      const combo = state.combo + 1;
      // Star Power doubles the multiplier.
      const points = 50 * multiplier(state.combo) * (event.starPower ? 2 : 1);

      return {
        ...state,
        score: state.score + points,
        combo,
        maxCombo: Math.max(state.maxCombo, combo),
        hits: new Set(state.hits).add(event.cue),
        flashes: { ...state.flashes, [event.lane]: { kind: 'hit', at: event.at } },
      };
    }
    case 'miss':
      return { ...state, combo: 0, flashes: { ...state.flashes, [event.lane]: { kind: 'miss', at: event.at } } };
    case 'sustain':
      return { ...state, score: state.score + Math.round(event.length * 100) * multiplier(state.combo) };
    case 'banner':
      return { ...state, banner: { text: event.text, at: event.at } };
  }
}

/** 1x, rising by one every ten notes in a row, up to 4x. */
export function multiplier(combo: number): number {
  return Math.min(4, 1 + Math.floor(combo / 10));
}

/** The share of notes hit, as a whole percentage, within a span such as a solo or a section. */
export function accuracy(
  notes: readonly NoteCue[],
  hits: ReadonlySet<NoteCue>,
  span: { startTime: number; endTime: number } = { startTime: 0, endTime: Infinity }
): number {
  const played = notes.filter(({ value }) => value && value.time >= span.startTime && value.time < span.endTime);
  if (!played.length) return 0;

  return Math.round((100 * played.filter((note) => hits.has(note)).length) / played.length);
}
