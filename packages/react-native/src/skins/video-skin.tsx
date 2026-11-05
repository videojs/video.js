import type { ReactNode } from 'react';

import { Container, type ContainerProps } from '../player/container';
import { PlayButton } from '../ui/play-button';

export interface VideoSkinProps extends ContainerProps {
  children?: ReactNode | undefined;
}

/**
 * Chrome for a video player: a container holding the media surface and the controls as siblings.
 *
 * `children` renders first so the media sits beneath the chrome, matching the generated web skin. Play/pause is the
 * whole control set for now — the shared `*Core` classes exist for the rest, but every other control needs store
 * features that cannot attach yet.
 *
 * ```tsx
 * <VideoSkin>
 *   <Video src="…" />
 * </VideoSkin>;
 * ```
 */
export function VideoSkin({ children, ...props }: VideoSkinProps): ReactNode {
  return (
    <Container {...props}>
      {children}
      <PlayButton />
    </Container>
  );
}

export namespace VideoSkin {
  export type Props = VideoSkinProps;
}
