import { type PropsOf, Slot, type VjscNode } from 'vjsc/components';

import { ErrorDialog } from '../../../components/dialogs/error-dialog';
import { BufferingIndicator } from '../../../components/display/buffering-indicator';
import { Poster } from '../../../components/display/poster';
import { Title } from '../../../components/display/title';
import { Container } from '../../../components/layout/container';
import type { SkinDescription } from '../../../meta';
import { LiveVideoGestures } from '../../shared/live-video/behaviors/gestures';
import { LiveVideoHotkeys } from '../../shared/live-video/behaviors/hotkeys';
import { LiveVideoStatusIndicators } from '../../shared/live-video/display/status-indicators';
import videoSkinStyles from '../../shared/video/skin.styles';
import { NeutralLiveVideoControls } from './layout/controls';

export interface LiveVideoSkinProps extends Omit<PropsOf<typeof Container>, 'children'> {
  children?: VjscNode;
  renderPoster?: PropsOf<typeof Poster>['renderImage'];
}

export function LiveVideoSkin({ children, className, renderPoster, ...props }: LiveVideoSkinProps = {}) {
  return (
    <Container className={[videoSkinStyles.root, className]} data-theme="neutral" data-preset="live-video" {...props}>
      <Slot name="media" />
      <Slot>{children}</Slot>
      <Poster renderImage={renderPoster} />
      <BufferingIndicator />
      <ErrorDialog />
      <Title />
      <NeutralLiveVideoControls />
      <LiveVideoHotkeys />
      <LiveVideoGestures />
      <LiveVideoStatusIndicators />
    </Container>
  );
}

export const meta = {
  title: 'Neutral Live Video Skin',
  description: 'A compact live video skin with live-edge, captions, remote playback, feedback, and input controls.',
} as const satisfies SkinDescription;
