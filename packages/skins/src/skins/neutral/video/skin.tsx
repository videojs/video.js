import { type PropsOf, Slot, type VjscNode } from 'vjsc/components';

import { ErrorDialog } from '../../../components/dialogs/error-dialog';
import { BufferingIndicator } from '../../../components/display/buffering-indicator';
import { Poster } from '../../../components/display/poster';
import { Title } from '../../../components/display/title';
import { Container } from '../../../components/layout/container';
import type { SkinDescription } from '../../../meta';
import { VideoGestures } from '../../shared/video/behaviors/gestures';
import { VideoHotkeys } from '../../shared/video/behaviors/hotkeys';
import { VideoStatusIndicators } from '../../shared/video/display/status-indicators';
import videoSkinStyles from '../../shared/video/skin.styles';
import { NeutralVideoControls } from './layout/controls';

export interface VideoSkinProps extends Omit<PropsOf<typeof Container>, 'children'> {
  children?: VjscNode;
  renderPoster?: PropsOf<typeof Poster>['renderImage'];
  renderThumbnail?: PropsOf<typeof NeutralVideoControls>['renderThumbnail'];
}

export function VideoSkin({ children, className, renderPoster, renderThumbnail, ...props }: VideoSkinProps = {}) {
  return (
    <Container className={[videoSkinStyles.root, className]} data-theme="neutral" data-preset="video" {...props}>
      <Slot name="media" />
      <Slot>{children}</Slot>
      <Poster renderImage={renderPoster} />
      <BufferingIndicator />
      <ErrorDialog />
      <Title />

      <NeutralVideoControls renderThumbnail={renderThumbnail} />

      <VideoHotkeys />
      <VideoGestures />
      <VideoStatusIndicators />
    </Container>
  );
}

export const meta = {
  title: 'Neutral Video Skin',
  description: 'A compact on-demand video skin with wrapping controls and the complete video component set.',
} as const satisfies SkinDescription;
