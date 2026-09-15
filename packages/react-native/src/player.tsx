import { forwardRef } from 'react';
import type { ViewProps } from 'react-native';

import type { PlayerStatus } from './player-context';

export type { PlayerStatus };

interface PlayerProps extends ViewProps {
  source: string;
  onStatusChange?: ((status: PlayerStatus) => void) | undefined;
}

interface PlayerRef {
  play: () => void;
  pause: () => void;
}

// Mirrors the native component's `forwardRef` signature so the two files
// present the same type — consumers typecheck against whichever resolves.
export const Player = forwardRef<PlayerRef, PlayerProps>(function Player() {
  throw new Error("'@videojs/react-native' is only supported on native platforms.");
});

export namespace Player {
  export type Props = PlayerProps;
  export type Ref = PlayerRef;
}
