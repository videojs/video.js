'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

interface PopupState {
  open: boolean;
  side: string | undefined;
}

interface PositionedState<State extends PopupState> {
  state: State;
  preferredSide: State['side'];
  setPositionedSide: (side: State['side']) => void;
}

export function usePositionedState<State extends PopupState>(preferredState: State): PositionedState<State> {
  const preferredSide = preferredState.side;
  const [position, setPosition] = useState<{ preferred: State['side']; side: State['side'] }>({
    preferred: preferredSide,
    side: preferredSide,
  });

  const side = preferredState.open && position.preferred === preferredSide ? position.side : preferredSide;

  const state = useMemo(
    () => (side === preferredSide ? preferredState : { ...preferredState, side }),
    [side, preferredState, preferredSide]
  );

  const setPositionedSide = useCallback(
    (nextSide: State['side']) =>
      setPosition((prev) =>
        prev.preferred === preferredSide && prev.side === nextSide ? prev : { preferred: preferredSide, side: nextSide }
      ),
    [preferredSide]
  );

  useEffect(() => {
    if (!preferredState.open) setPositionedSide(preferredSide);
  }, [preferredState.open, preferredSide, setPositionedSide]);

  return { state, preferredSide, setPositionedSide };
}
