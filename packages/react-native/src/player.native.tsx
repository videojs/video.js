import { forwardRef, type Ref as ReactRef, useImperativeHandle } from 'react';
import type { ViewProps } from 'react-native';
import { PlayerSurface } from './element/player-surface';
import { PlayerProvider, type PlayerStatus, usePlayerContext } from './player-context';

export type { PlayerStatus };

interface PlayerProps extends ViewProps {
  source?: string | undefined;
  onStatusChange?: ((status: PlayerStatus) => void) | undefined;
}

interface PlayerRef {
  play: () => void;
  pause: () => void;
}

function PlayerBody({ forwardedRef, ...viewProps }: ViewProps & { forwardedRef: ReactRef<PlayerRef> }) {
  const { play, pause } = usePlayerContext();

  useImperativeHandle(forwardedRef, () => ({ play, pause }), [play, pause]);

  return <PlayerSurface {...viewProps} />;
}

/**
 * A video player that behaves like an ordinary RN view. The native handle and
 * the Fabric surface backing it are implementation details — control the
 * player through the ref.
 */
export const Player = forwardRef<PlayerRef, PlayerProps>(function Player(
  { source, onStatusChange, ...viewProps },
  ref
) {
  return (
    <PlayerProvider source={source} onStatusChange={onStatusChange}>
      <PlayerBody {...viewProps} forwardedRef={ref} />
    </PlayerProvider>
  );
});

export namespace Player {
  export type Props = PlayerProps;
  export type Ref = PlayerRef;
}
