import * as $ from '@videojs/core/vjsc';
import { type PropsOf, Slot, type VjscNode } from 'vjsc/components';

import type { SkinDescription } from '../../../meta';
import { LiveVideoGestures } from '../../shared/live-video/behaviors/gestures';
import { LiveVideoHotkeys } from '../../shared/live-video/behaviors/hotkeys';
import containerStyles from '../shared/container.styles';
import { ErrorDialog } from '../shared/error-dialog';
import { Indicators } from '../shared/indicators';
import { StatusAnnouncer } from '../shared/status-announcer';
import { Title } from '../shared/title';
import { BufferingIndicator, Poster } from '../shared/video-feedback';
import { LiveVideoControls } from './controls';

export interface LiveVideoSkinProps extends Omit<PropsOf<typeof $.Container>, 'children'> {
  children?: VjscNode;
  renderPoster?: PropsOf<typeof $.Poster.Image>['children'];
}

export function LiveVideoSkin({ children, className, renderPoster, ...props }: LiveVideoSkinProps = {}) {
  return (
    <$.Container
      className={['media-skin', containerStyles.root, containerStyles.video, className]}
      data-theme="compat"
      data-preset="live-video"
      {...props}
    >
      <Slot>{children}</Slot>
      <Poster renderImage={renderPoster} />
      <BufferingIndicator />
      <ErrorDialog />
      <Title />
      <LiveVideoControls />

      <LiveVideoHotkeys />
      <LiveVideoGestures />
      <StatusAnnouncer />
      <Indicators />
    </$.Container>
  );
}

export const meta = {
  title: 'Compat Live Video Skin',
  description: 'A live video skin designed for broader browser compatibility.',
} as const satisfies SkinDescription;
