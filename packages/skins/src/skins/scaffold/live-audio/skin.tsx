import * as $ from '@videojs/core/vjsc';
import { type PropsOf, Slot, type VjscNode } from 'vjsc/components';

import type { SkinDescription } from '../../../meta';
import { LivePlaybackHotkeys } from '../../shared/behaviors/live-playback-hotkeys';
import containerStyles from '../shared/container.styles';
import { ErrorDialog } from '../shared/error-dialog';
import { StatusAnnouncer } from '../shared/status-announcer';
import { LiveAudioControls } from './controls';

export interface LiveAudioSkinProps extends Omit<PropsOf<typeof $.Container>, 'children'> {
  children?: VjscNode;
}

export function LiveAudioSkin({ children, className, ...props }: LiveAudioSkinProps = {}) {
  return (
    <$.Container
      className={['media-skin', containerStyles.root, containerStyles.audio, className]}
      data-theme="scaffold"
      data-preset="live-audio"
      {...props}
    >
      <Slot name="media" />
      <Slot>{children}</Slot>
      <ErrorDialog />
      <LiveAudioControls />

      <LivePlaybackHotkeys />
      <StatusAnnouncer />
    </$.Container>
  );
}

export const meta = {
  title: 'Scaffold Live Audio Skin',
  description: 'A live audio skin with minimal styling for custom skins.',
} as const satisfies SkinDescription;
