import { useEffect, useEffectEvent } from 'react';

import type { Lane } from './song';

/** Keys 1 to 5 play the five lanes, green to orange. */
const LANE_KEYS = ['1', '2', '3', '4', '5'];

/** Call `press` and `release` as the lane keys go down and up. */
export function useLaneKeys(press: (lane: Lane) => void, release: (lane: Lane) => void): void {
  const onKey = useEffectEvent((event: KeyboardEvent) => {
    const lane = LANE_KEYS.indexOf(event.key) as Lane | -1;
    if (lane === -1 || event.repeat) return;

    if (event.type === 'keydown') press(lane);
    else release(lane);
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKey(event);

    window.addEventListener('keydown', listener);
    window.addEventListener('keyup', listener);

    return () => {
      window.removeEventListener('keydown', listener);
      window.removeEventListener('keyup', listener);
    };
  }, []);
}
