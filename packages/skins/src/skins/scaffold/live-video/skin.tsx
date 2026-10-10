import * as $ from '@videojs/core/vjsc';
import { type PropsOf, Slot, type VjscNode } from 'vjsc/components';

import type { SkinDescription } from '../../../meta';
import { LiveVideoGestures } from '../../shared/live-video/behaviors/gestures';
import { LiveVideoHotkeys } from '../../shared/live-video/behaviors/hotkeys';
import containerStyles from '../shared/container.styles';
import { ErrorDialog } from '../shared/error-dialog';
import { Indicators } from '../shared/indicators';
import { StatusAnnouncer } from '../shared/status-announcer';
import { Poster } from '../shared/video-feedback';
import { LiveVideoControls } from './controls';

export interface LiveVideoSkinProps extends Omit<PropsOf<typeof $.Container>, 'children'> {
  children?: VjscNode;
  renderPoster?: PropsOf<typeof $.Poster.Image>['children'];
}

export function LiveVideoSkin({ children, className, renderPoster, ...props }: LiveVideoSkinProps = {}) {
  return (
    <$.Container
      className={['media-skin', containerStyles.root, containerStyles.video, className]}
      data-theme="scaffold"
      data-preset="live-video"
      {...props}
    >
      <Slot name="media" />
      <Slot>{children}</Slot>
      <Poster renderImage={renderPoster} />
      <ErrorDialog />
      <LiveVideoControls />

      <LiveVideoHotkeys />
      <LiveVideoGestures />
      <StatusAnnouncer />
      <Indicators />
    </$.Container>
  );
}

export const meta = {
  title: 'Scaffold Live Video Skin',
  description: 'A live video skin with minimal styling for custom skins.',
} as const satisfies SkinDescription;
