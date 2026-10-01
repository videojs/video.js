import * as $ from '@videojs/core/vjsc';
import type { PropsOf } from 'vjsc/components';

import { AirPlayButton } from '../../../../components/buttons/airplay-button';
import { ButtonTooltip } from '../../../../components/buttons/button-tooltip';
import { CaptionsButton } from '../../../../components/buttons/captions-button';
import { CastButton } from '../../../../components/buttons/cast-button';
import { FullscreenButton } from '../../../../components/buttons/fullscreen-button';
import { PiPButton } from '../../../../components/buttons/pip-button';
import { PlayButton } from '../../../../components/buttons/play-button';
import { VolumePopover } from '../../../../components/menus/volume-popover';
import { TimeSlider } from '../../../../components/sliders/time-slider';
import timeStyles from '../../../../styles/display/time.styles';
import controlsStyles from '../../../../styles/layout/controls.styles';
import { VideoSettingsMenu } from '../../../shared/video/menus/settings-menu';
import styles from './controls.styles';

export interface NeutralVideoControlsProps {
  renderThumbnail?: PropsOf<typeof TimeSlider>['renderThumbnail'];
}

export function NeutralVideoControls({ renderThumbnail }: NeutralVideoControlsProps = {}) {
  return (
    <$.Controls.Root>
      <$.Controls.Backdrop className={controlsStyles.backdrop} />
      <$.Controls.Content className={[controlsStyles.root, controlsStyles.content, styles.content]}>
        <$.Tooltip.Provider>
          <$.Controls.Group className={styles.start}>
            <ButtonTooltip side="top">
              <PlayButton />
            </ButtonTooltip>
            <VolumePopover showTooltip side="right" orientation="horizontal" />
          </$.Controls.Group>

          <$.Controls.Group className={styles.timeSliderGroup}>
            <$.Time.Group className={timeStyles.group}>
              <$.Time.Value className={[timeStyles.toggle, timeStyles.currentValue]} type="current" toggle />
              <$.Time.Separator className={timeStyles.separator} />
              <$.Time.Value className={timeStyles.durationValue} type="duration" />
            </$.Time.Group>
            <TimeSlider previewOverflow="clamp" renderThumbnail={renderThumbnail} />
          </$.Controls.Group>

          <$.Controls.Group className={styles.end}>
            <ButtonTooltip side="top">
              <CaptionsButton className={controlsStyles.captionsButton} />
            </ButtonTooltip>
            <VideoSettingsMenu />
            <$.Controls.Group className={styles.trailing}>
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
          </$.Controls.Group>
        </$.Tooltip.Provider>
      </$.Controls.Content>
    </$.Controls.Root>
  );
}
