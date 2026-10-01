import * as $ from '@videojs/core/vjsc';
import { type PropsOf, Slot, type VjscNode } from 'vjsc/components';

import type { SkinDescription } from '../../../meta';
import { PlaybackHotkeys } from '../../shared/behaviors/playback-hotkeys';
import containerStyles from '../shared/container.styles';
import { ErrorDialog } from '../shared/error-dialog';
import { StatusAnnouncer } from '../shared/status-announcer';
import { AudioControls } from './controls';

export interface AudioSkinProps extends Omit<PropsOf<typeof $.Container>, 'children'> {
  children?: VjscNode;
  renderThumbnail?: PropsOf<typeof $.Slider.Thumbnail.Image>['children'];
}

export function AudioSkin({ children, className, renderThumbnail, ...props }: AudioSkinProps = {}) {
  return (
    <$.Container
      className={['media-skin', containerStyles.root, containerStyles.audio, className]}
      data-theme="compat"
      data-preset="audio"
      {...props}
    >
      <Slot>{children}</Slot>
      <ErrorDialog />
      <AudioControls renderThumbnail={renderThumbnail} />

      <PlaybackHotkeys />
      <StatusAnnouncer />
    </$.Container>
  );
}

export const meta = {
  title: 'Compat Audio Skin',
  description: 'An on-demand audio skin designed for broader browser compatibility.',
} as const satisfies SkinDescription;
