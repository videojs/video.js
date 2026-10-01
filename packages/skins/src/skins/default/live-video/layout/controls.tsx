import * as $ from '@videojs/core/vjsc';
import { Box } from 'vjsc/components';

import { AirPlayButton } from '../../../../components/buttons/airplay-button';
import { ButtonTooltip } from '../../../../components/buttons/button-tooltip';
import { CastButton } from '../../../../components/buttons/cast-button';
import { FullscreenButton } from '../../../../components/buttons/fullscreen-button';
import { LiveButton } from '../../../../components/buttons/live-button';
import { PiPButton } from '../../../../components/buttons/pip-button';
import { PlayButton } from '../../../../components/buttons/play-button';
import { CaptionsMenu } from '../../../../components/menus/captions-menu';
import { VolumePopover } from '../../../../components/menus/volume-popover';
import controlsStyles from '../../../../styles/layout/controls.styles';
import styles from './controls.styles';

export function DefaultLiveVideoControls() {
  return (
    <$.Controls.Root>
      <$.Controls.Backdrop className={controlsStyles.backdrop} />
      <$.Controls.Content className={[controlsStyles.root, controlsStyles.content, styles.spaced]}>
        <$.Tooltip.Provider>
          <$.Controls.Group className={[controlsStyles.primary, styles.spaced]}>
            <ButtonTooltip side="top">
              <PlayButton />
            </ButtonTooltip>
            <LiveButton />
            <Box aria-hidden="true" className={controlsStyles.spacer} />
            <VolumePopover />
            <CaptionsMenu />
            <ButtonTooltip side="top">
              <CastButton />
            </ButtonTooltip>
            <ButtonTooltip side="top">
              <AirPlayButton />
            </ButtonTooltip>
            <ButtonTooltip side="top">
              <PiPButton />
            </ButtonTooltip>
            <ButtonTooltip side="top">
              <FullscreenButton />
            </ButtonTooltip>
          </$.Controls.Group>
        </$.Tooltip.Provider>
      </$.Controls.Content>
    </$.Controls.Root>
  );
}
