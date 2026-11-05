import { type PropsOf, Slot, type VjscNode } from 'vjsc/components';

import { StatusAnnouncer } from '../../../components/behaviors/status-announcer';
import { Container } from '../../../components/layout/container';
import type { SkinDescription } from '../../../meta';
import { AudioErrorDialog } from '../../shared/audio/dialogs/error-dialog';
import audioSkinStyles from '../../shared/audio/skin.styles';
import { PlaybackHotkeys } from '../../shared/behaviors/playback-hotkeys';
import { DefaultAudioControls } from './layout/controls';

export interface AudioSkinProps extends Omit<PropsOf<typeof Container>, 'children'> {
  children?: VjscNode;
}

export function AudioSkin({ children, className, ...props }: AudioSkinProps = {}) {
  return (
    <Container className={[audioSkinStyles.root, className]} data-theme="default" data-preset="audio" {...props}>
      <Slot name="media" />
      <Slot>{children}</Slot>
      <AudioErrorDialog />
      <DefaultAudioControls />
      <PlaybackHotkeys />
      <StatusAnnouncer />
    </Container>
  );
}

export const meta = {
  title: 'Default Audio Skin',
  description: 'A complete on-demand audio skin with playback, seeking, volume, speed, and feedback controls.',
} as const satisfies SkinDescription;
