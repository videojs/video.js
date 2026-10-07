import * as $ from '@videojs/core/vjsc';
import { Box } from 'vjsc/components';

import { AirPlayButton } from '../../../../components/buttons/airplay-button';
import { ButtonTooltip } from '../../../../components/buttons/button-tooltip';
import { CastButton } from '../../../../components/buttons/cast-button';
import { FCastButton, type FCastButtonProps } from '../../../../components/buttons/fcast-button';
import { FullscreenButton } from '../../../../components/buttons/fullscreen-button';
import { LiveButton } from '../../../../components/buttons/live-button';
import { PiPButton } from '../../../../components/buttons/pip-button';
import { PlayButton } from '../../../../components/buttons/play-button';
import { CaptionsMenu } from '../../../../components/menus/captions-menu';
import { VolumePopover } from '../../../../components/menus/volume-popover';
import controlsStyles from '../../../../styles/layout/controls.styles';
import styles from './controls.styles';

export function NeutralLiveVideoControls({ fcast }: { fcast?: FCastButtonProps | undefined } = {}) {
  return (
    <$.Controls.Root>
      <$.Controls.Backdrop className={controlsStyles.backdrop} />
      <$.Controls.Content className={[controlsStyles.root, controlsStyles.content]}>
        <$.Tooltip.Provider>
          <$.Controls.Group className={styles.start}>
            <ButtonTooltip side="top">
              <PlayButton />
            </ButtonTooltip>
            <LiveButton />
            <VolumePopover showTooltip side="right" orientation="horizontal" />
          </$.Controls.Group>

          <Box aria-hidden="true" className={controlsStyles.spacer} />

          <$.Controls.Group className={styles.end}>
            <CaptionsMenu />
            <ButtonTooltip side="top">
              <CastButton />
            </ButtonTooltip>
            <ButtonTooltip side="top">
              <FCastButton {...fcast} />
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
