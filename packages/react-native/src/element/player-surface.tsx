import type { ViewProps } from 'react-native';

import { usePlayerContext } from '../player-context';
import NativePlayerView from '../PlayerViewNativeComponent';

/**
 * Rendering surface for video frames. Renders nothing until it's given a player handle from the context, which is
 * typically provided by a <VideoPlayer> or <PlayerProvider>. The handle is a unique identifier for a native player
 * instance, which the surface uses to bind to the correct player.
 */
export function PlayerSurface(props: ViewProps) {
  const { handle } = usePlayerContext();
  if (handle === null) return null;

  return <NativePlayerView playerHandle={handle} {...props} />;
}

export namespace PlayerSurface {
  export type Props = ViewProps;
}
