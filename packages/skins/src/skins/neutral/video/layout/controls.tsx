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
      <$.BufferingIndicator className={controlsStyles.centerBuffering}>
        <$.Controls.Group className={[controlsStyles.center, styles.compactCenter]}>
          <PlayButton
            className={[controlsStyles.centerButton, controlsStyles.centerPlay]}
            iconClassName={controlsStyles.centerPlayIcon}
          />
        </$.Controls.Group>
      </$.BufferingIndicator>
      <$.Controls.Backdrop className={[controlsStyles.backdrop, styles.compactBackdrop]} />
      <$.Controls.Content className={[controlsStyles.root, controlsStyles.content, styles.content]}>
        <$.Tooltip.Provider>
          <$.Controls.Group className={styles.start}>
            <ButtonTooltip side="top">
              <PlayButton className={styles.playButton} />
            </ButtonTooltip>
            <VolumePopover className={styles.volumeButton} showTooltip side="right" orientation="horizontal" />
            <$.Time.Group className={[timeStyles.group, styles.time]}>
              <$.Time.Value className={timeStyles.toggle} type="current" toggle />
              <$.Time.Separator className={timeStyles.separator} />
              <$.Time.Value className={timeStyles.durationValue} type="duration" />
            </$.Time.Group>
          </$.Controls.Group>

          <$.Controls.Group className={styles.timeSliderGroup}>
            <TimeSlider previewOverflow="clamp" renderThumbnail={renderThumbnail} />
          </$.Controls.Group>

          <$.Controls.Group className={styles.end}>
            <ButtonTooltip side="top">
              <CaptionsButton className={controlsStyles.captionsButton} />
            </ButtonTooltip>
            <VideoSettingsMenu className={styles.settingsButton} />
            <$.Controls.Group className={styles.trailing}>
              <ButtonTooltip side="top">
                <CastButton className={styles.castButton} />
              </ButtonTooltip>
              <ButtonTooltip side="top">
                <AirPlayButton className={styles.airplayButton} />
              </ButtonTooltip>
              <ButtonTooltip side="top">
                <PiPButton className={styles.pipButton} />
              </ButtonTooltip>
              <ButtonTooltip side="top">
                <FullscreenButton className={styles.fullscreenButton} />
              </ButtonTooltip>
            </$.Controls.Group>
          </$.Controls.Group>
        </$.Tooltip.Provider>
      </$.Controls.Content>
    </$.Controls.Root>
  );
}
