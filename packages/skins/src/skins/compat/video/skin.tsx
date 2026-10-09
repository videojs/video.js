import * as $ from '@videojs/core/vjsc';
import type { FCastSender } from '@videojs/fcast';
import { type PropsOf, Slot, type VjscNode } from 'vjsc/components';

import type { SkinDescription } from '../../../meta';
import { VideoGestures } from '../../shared/video/behaviors/gestures';
import { VideoHotkeys } from '../../shared/video/behaviors/hotkeys';
import containerStyles from '../shared/container.styles';
import { ErrorDialog } from '../shared/error-dialog';
import { Indicators } from '../shared/indicators';
import { SeekIndicator } from '../shared/seek-indicator';
import { StatusAnnouncer } from '../shared/status-announcer';
import { Title } from '../shared/title';
import { BufferingIndicator, Poster } from '../shared/video-feedback';
import { VideoControls } from './controls';

export interface VideoSkinProps extends Omit<PropsOf<typeof $.Container>, 'children'> {
  children?: VjscNode;
  renderPoster?: PropsOf<typeof $.Poster.Image>['children'];
  renderThumbnail?: PropsOf<typeof $.Slider.Thumbnail.Image>['children'];
  fcastSender?: FCastSender;
  fcastSrc?: string;
  fcastContentType?: string;
}

export function VideoSkin({
  children,
  className,
  renderPoster,
  renderThumbnail,
  fcastSender,
  fcastSrc,
  fcastContentType,
  ...props
}: VideoSkinProps = {}) {
  return (
    <$.Container
      className={['media-skin', containerStyles.root, containerStyles.video, className]}
      data-theme="compat"
      data-preset="video"
      {...props}
    >
      <Slot>{children}</Slot>
      <Poster renderImage={renderPoster} />
      <BufferingIndicator />
      <ErrorDialog />
      <Title />
      <VideoControls
        renderThumbnail={renderThumbnail}
        fcast={{ sender: fcastSender, src: fcastSrc, contentType: fcastContentType }}
      />

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
  title: 'Compat Video Skin',
  description: 'An on-demand video skin designed for broader browser compatibility.',
} as const satisfies SkinDescription;
