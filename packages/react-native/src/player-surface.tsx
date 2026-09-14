import type { ViewProps } from 'react-native';
import NativePlayerView from './PlayerViewNativeComponent';
import { usePlayerContext } from './player-context';

/**
 * Renders nothing until the provider has a handle — the native view is a
 * window onto an existing player, so there is nothing to show before one
 * exists.
 */
export function PlayerSurface(props: ViewProps) {
  const { handle } = usePlayerContext();

  if (handle === null) return null;

  return <NativePlayerView playerHandle={handle} {...props} />;
}

export namespace PlayerSurface {
  export type Props = ViewProps;
}
