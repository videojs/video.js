import { type PropsOf, Slot, type VjscNode } from 'vjsc/components';

import { StatusAnnouncer } from '../../../components/behaviors/status-announcer';
import { Container } from '../../../components/layout/container';
import type { SkinDescription } from '../../../meta';
import { AudioErrorDialog } from '../../shared/audio/dialogs/error-dialog';
import audioSkinStyles from '../../shared/audio/skin.styles';
import { LivePlaybackHotkeys } from '../../shared/behaviors/live-playback-hotkeys';
import { NeutralLiveAudioControls } from './layout/controls';

export interface LiveAudioSkinProps extends Omit<PropsOf<typeof Container>, 'children'> {
  children?: VjscNode;
}

export function LiveAudioSkin({ children, className, ...props }: LiveAudioSkinProps = {}) {
  return (
    <Container className={[audioSkinStyles.root, className]} data-theme="neutral" data-preset="live-audio" {...props}>
      <Slot name="media" />
      <Slot>{children}</Slot>
      <AudioErrorDialog />
      <NeutralLiveAudioControls />
      <LivePlaybackHotkeys />
      <StatusAnnouncer />
    </Container>
  );
}

export const meta = {
  title: 'Neutral Live Audio Skin',
  description: 'A compact live audio skin with play, live-edge, volume, error, and keyboard feedback controls.',
} as const satisfies SkinDescription;
