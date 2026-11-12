import { type MediaTextCue, useActiveTextCues, useTextCues } from '@videojs/react';
import { usePlayer } from '@videojs/react/video';
import { useReducer, useRef } from 'react';

import type { Lane, Note } from './song';
import { notesTrack, solosTrack, starPowerTrack, sustainsTrack } from './tracks';
import { useCueEvents } from './use-cue-events';
import { useLaneKeys } from './use-lane-keys';

export type NoteCue = MediaTextCue<Note>;

/** What happened on a lane, and when, which keys the flash so each one replays. */
export interface Flash {
  kind: 'hit' | 'miss';
  at: number;
}

export interface GameState {
  score: number;
  combo: number;
  maxCombo: number;
  hits: ReadonlySet<NoteCue>;
  flashes: Partial<Record<Lane, Flash>>;
  banner: { text: string; at: number } | null;
}

type GameEvent =
  | { type: 'hit'; cue: NoteCue; starPower: boolean; at: number }
  | { type: 'miss'; lane: Lane; at: number }
  | { type: 'sustain'; length: number }
  | { type: 'banner'; text: string; at: number };

const NEW_GAME: GameState = { score: 0, combo: 0, maxCombo: 0, hits: new Set(), flashes: {}, banner: null };

/** Play the notes track: strum lanes with keys 1 to 5 or the tap zones, as each note's cue passes the strike line. */
export function useGame(clock: { readonly currentTime: number }) {
  const store = usePlayer();
  const notes = useTextCues(notesTrack);
  const starPower = useActiveTextCues(starPowerTrack).length > 0;
  const [game, dispatch] = useReducer(play, NEW_GAME);
  const held = useRef(new Set<Lane>());

  function press(lane: Lane) {
    // Judge at the moment of the keypress, on the media's own clock. Active cues move only with time updates, and a
    // strum can land between two of them.
    const time = clock.currentTime;
    const cue = notes.find(
      (note) => note.value?.lane === lane && !game.hits.has(note) && note.startTime <= time && time < note.endTime
    );

    held.current.add(lane);

    // A strum with no note to hit breaks the combo.
    if (!cue) return dispatch({ type: 'miss', lane, at: time });

    store.selectAudioTrack('hit');
    dispatch({ type: 'hit', cue, starPower, at: time });
  }

  function release(lane: Lane) {
    held.current.delete(lane);
  }

  useLaneKeys(press, release);

  // A note whose hit window passes without a hit is a miss, and mutes the part.
  useCueEvents(notesTrack, {
    onExit(cue) {
      if (game.hits.has(cue) || !cue.value) return;

      store.selectAudioTrack('missed');
      dispatch({ type: 'miss', lane: cue.value.lane, at: cue.endTime });
    },
  });

  // Holding a note to the end of its sustain earns a bonus.
  useCueEvents(sustainsTrack, {
    onExit(cue) {
      if (cue.value && held.current.has(cue.value.lane)) dispatch({ type: 'sustain', length: cue.value.length });
    },
  });

  useCueEvents(solosTrack, {
    onEnter: (cue) => dispatch({ type: 'banner', text: 'SOLO!', at: cue.startTime }),
    onExit: (cue) =>
      dispatch({ type: 'banner', text: `Solo: ${accuracy(notes, game.hits, cue)}%`, at: cue.endTime }),
  });

  return { ...game, notes, starPower, multiplier: multiplier(game.combo), press, release };
}

export type Game = ReturnType<typeof useGame>;

/** 1x, rising by one every ten notes in a row, up to 4x. */
export function multiplier(combo: number): number {
  return Math.min(4, 1 + Math.floor(combo / 10));
}

/** The share of notes hit, as a whole percentage, within a span such as a solo or section. */
export function accuracy(
  notes: readonly NoteCue[],
  hits: ReadonlySet<NoteCue>,
  span: { startTime: number; endTime: number } = { startTime: 0, endTime: Infinity }
): number {
  const played = notes.filter(({ value }) => value && value.time >= span.startTime && value.time < span.endTime);
  if (!played.length) return 0;

  return Math.round((100 * played.filter((note) => hits.has(note)).length) / played.length);
}

function play(game: GameState, event: GameEvent): GameState {
  switch (event.type) {
    case 'hit': {
      const lane = event.cue.value!.lane;
      const combo = game.combo + 1;
      // Star Power doubles the multiplier.
      const points = 50 * multiplier(game.combo) * (event.starPower ? 2 : 1);

      return {
        ...game,
        score: game.score + points,
        combo,
        maxCombo: Math.max(game.maxCombo, combo),
        hits: new Set(game.hits).add(event.cue),
        flashes: { ...game.flashes, [lane]: { kind: 'hit', at: event.at } },
      };
    }
    case 'miss':
      return { ...game, combo: 0, flashes: { ...game.flashes, [event.lane]: { kind: 'miss', at: event.at } } };
    case 'sustain':
      return { ...game, score: game.score + Math.round(event.length * 100) * multiplier(game.combo) };
    case 'banner':
      return { ...game, banner: { text: event.text, at: event.at } };
  }
}
