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

export function Player(_props: PlayerProps): never {
  throw new Error("'@videojs/react-native' is only supported on native platforms.");
}

export namespace Player {
  export type Props = PlayerProps;
  export type Ref = PlayerRef;
}
