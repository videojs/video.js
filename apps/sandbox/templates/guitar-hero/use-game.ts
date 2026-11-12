import { useActiveTextCues, useTextCues } from '@videojs/react';
import { usePlayer } from '@videojs/react/video';
import { useReducer, useRef } from 'react';

import { accuracy, multiplier, NEW_SCORE, score } from './score';
import type { Lane } from './song';
import { notesTrack, solosTrack, starPowerTrack, sustainsTrack } from './tracks';
import { useCueEvents } from './use-cue-events';
import { useLaneKeys } from './use-lane-keys';

/** Play along: strum a lane as its note's cue passes the strike line, with keys 1 to 5 or the tap zones. */
export function useGame(clock: { readonly currentTime: number }) {
  const store = usePlayer();
  const notes = useTextCues(notesTrack);
  const starPower = useActiveTextCues(starPowerTrack).length > 0;
  const [state, dispatch] = useReducer(score, NEW_SCORE);
  const held = useRef(new Set<Lane>());

  function press(lane: Lane) {
    // Judge on the media's clock at the moment of the keypress. Active cues only move with time updates, and a strum
    // can land between two of them.
    const time = clock.currentTime;
    const cue = notes.find(
      (note) => note.value?.lane === lane && !state.hits.has(note) && note.startTime <= time && time < note.endTime
    );

    held.current.add(lane);

    // A strum with no note to hit breaks the combo.
    if (!cue) return dispatch({ type: 'miss', lane, at: time });

    store.selectAudioTrack('hit');
    dispatch({ type: 'hit', cue, lane, starPower, at: time });
  }

  function release(lane: Lane) {
    held.current.delete(lane);
  }

  useLaneKeys(press, release);

  // A note whose hit window passes without a hit is a miss, and mutes the part.
  useCueEvents(notesTrack, {
    onExit(cue) {
      if (state.hits.has(cue) || !cue.value) return;

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
    onExit: (cue) => dispatch({ type: 'banner', text: `Solo: ${accuracy(notes, state.hits, cue)}%`, at: cue.endTime }),
  });

  return { ...state, notes, starPower, multiplier: multiplier(state.combo), press, release };
}

export type Game = ReturnType<typeof useGame>;
