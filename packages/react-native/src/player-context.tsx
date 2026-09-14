import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';

import NativePlayerStore, { type PlayerEvent, type Spec } from './NativePlayerStore';

export type PlayerStatus = PlayerEvent['type'];

interface PlayerContextValue {
  handle: number | null;
  play: () => void;
  pause: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

function requireStore(): Spec {
  const store = NativePlayerStore;

  if (store === null || store === undefined) {
    throw new Error(
      "@videojs/react-native: the 'VideoJSPlayerStore' native module is not registered. Rebuild the native app after adding the package."
    );
  }

  return store;
}

interface PlayerProviderProps {
  source: string;
  onStatusChange?: ((status: PlayerStatus) => void) | undefined;
  children?: ReactNode | undefined;
}

/**
 * Owns the native player for its subtree: creates a handle on mount, destroys
 * it on unmount, and demuxes the shared event channel down to this handle.
 * The handle never leaves this module's consumers — see `Player` for the
 * public surface.
 */
export function PlayerProvider({ source, onStatusChange, children }: PlayerProviderProps) {
  const [handle, setHandle] = useState<number | null>(null);

  // Kept in a ref so an inline onStatusChange doesn't resubscribe every render.
  const onStatusChangeRef = useRef(onStatusChange);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  useEffect(() => {
    const store = requireStore();
    const created = store.createPlayer(source);
    setHandle(created);

    return () => {
      store.destroyPlayer(created);
      setHandle(null);
    };
  }, [source]);

  useEffect(() => {
    if (handle === null) return;

    const subscription = requireStore().onPlayerEvent((event) => {
      if (event.handle !== handle) return;
      onStatusChangeRef.current?.(event.type);
    });

    return () => subscription.remove();
  }, [handle]);

  const value = useMemo<PlayerContextValue>(
    () => ({
      handle,
      play: () => {
        if (handle !== null) requireStore().play(handle);
      },
      pause: () => {
        if (handle !== null) requireStore().pause(handle);
      },
    }),
    [handle]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export namespace PlayerProvider {
  export type Props = PlayerProviderProps;
}

export function usePlayerContext(): PlayerContextValue {
  const context = useContext(PlayerContext);

  if (context === null) {
    throw new Error('@videojs/react-native: usePlayerContext must be used within a <PlayerProvider>.');
  }

  return context;
}

export namespace usePlayerContext {
  export type Result = PlayerContextValue;
}
