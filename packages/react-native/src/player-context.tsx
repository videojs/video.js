import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { requireEngineStore as requireStore } from './media/engine-store';
import type { PlayerEvent } from './media/NativeEngineStore';

export type PlayerStatus = PlayerEvent['type'];

interface PlayerContextValue {
  handle: number | null;
  play: () => void;
  pause: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

interface PlayerProviderProps {
  source?: string | undefined;
  onStatusChange?: ((status: PlayerStatus) => void) | undefined;
  children?: ReactNode | undefined;
}

/**
 * Owns the native player for its subtree: creates a handle on mount, destroys it on unmount, and demuxes the shared
 * event channel down to this handle. The handle survives a `source` change — the player is reused, not rebuilt, so the
 * surface never unmounts and there is no black frame between sources. A player created without a source sits idle until
 * one arrives. The handle never leaves this module's consumers — see `Player` for the public surface.
 */
export function PlayerProvider({ source, onStatusChange, children }: PlayerProviderProps) {
  const [handle, setHandle] = useState<number | null>(null);

  // Kept in a ref so an inline onStatusChange doesn't resubscribe every render.
  const onStatusChangeRef = useRef(onStatusChange);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  // The source the native player currently holds. Seeded with the mount-time
  // source because `createPlayer` applies it, so the first run of the effect
  // below is a no-op rather than an immediate reload.
  const appliedSource = useRef(source);

  // Mount-only: a source change swaps the source on the existing player, so
  // unmounting is the only thing that destroys one.
  useEffect(() => {
    const store = requireStore();
    const created = store.createPlayer(appliedSource.current ?? null);

    setHandle(created);

    return () => {
      store.destroyPlayer(created);
      setHandle(null);
    };
  }, []);

  // An undefined source leaves whatever the player already has alone — the
  // spec has no clear operation, so an idle player stays idle and a loaded one
  // keeps playing.
  useEffect(() => {
    if (handle === null || source === undefined || appliedSource.current === source) return;

    appliedSource.current = source;
    requireStore().setSource(handle, source);
  }, [handle, source]);

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
