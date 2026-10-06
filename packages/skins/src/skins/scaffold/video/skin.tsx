import * as $ from '@videojs/core/vjsc';
import { type PropsOf, Slot, type VjscNode } from 'vjsc/components';

import type { SkinDescription } from '../../../meta';
import { VideoGestures } from '../../shared/video/behaviors/gestures';
import { VideoHotkeys } from '../../shared/video/behaviors/hotkeys';
import containerStyles from '../shared/container.styles';
import { ErrorDialog } from '../shared/error-dialog';
import { Indicators } from '../shared/indicators';
import { SeekIndicator } from '../shared/seek-indicator';
import { StatusAnnouncer } from '../shared/status-announcer';
import { BufferingIndicator, Poster } from '../shared/video-feedback';
import { VideoControls } from './controls';

export interface VideoSkinProps extends Omit<PropsOf<typeof $.Container>, 'children'> {
  children?: VjscNode;
  renderPoster?: PropsOf<typeof $.Poster.Image>['children'];
  renderThumbnail?: PropsOf<typeof $.Slider.Thumbnail.Image>['children'];
}

export function VideoSkin({ children, className, renderPoster, renderThumbnail, ...props }: VideoSkinProps = {}) {
  return (
    <$.Container
      className={['media-skin', containerStyles.root, containerStyles.video, className]}
      data-theme="scaffold"
      data-preset="video"
      {...props}
    >
      <Slot>{children}</Slot>
      <Poster renderImage={renderPoster} />
      <BufferingIndicator />
      <ErrorDialog />
      <VideoControls renderThumbnail={renderThumbnail} />

      <VideoHotkeys />
      <VideoGestures />
      <StatusAnnouncer />
      <Indicators>
        <SeekIndicator />
      </Indicators>
    </$.Container>
  );
}

export const meta = {
  title: 'Scaffold Video Skin',
  description: 'An on-demand video skin with minimal styling for custom skins.',
} as const satisfies SkinDescription;
