import * as $ from '@videojs/core/vjsc';

import { ButtonTooltip } from '../../../../components/buttons/button-tooltip';
import { SeekButton } from '../../../../components/buttons/seek-button';
import { VolumePopover } from '../../../../components/menus/volume-popover';
import timeStyles from '../../../../styles/display/time.styles';
import audioControlsStyles from '../../../../styles/layout/audio-controls.styles';
import { AudioPlayButton } from '../../../shared/audio/buttons/play-button';
import { AudioSettingsMenu } from '../../../shared/audio/menus/settings-menu';
import { AudioTimeSlider } from '../../../shared/audio/sliders/time-slider';
import styles from './controls.styles';

export function NeutralAudioControls() {
  return (
    <$.Controls.Root visibility="always">
      <$.Controls.Content className={[audioControlsStyles.root, audioControlsStyles.content]}>
        <$.Tooltip.Provider>
          <$.Controls.Group className={audioControlsStyles.start}>
            <AudioPlayButton />
            <ButtonTooltip boundary="viewport" side="top">
              <SeekButton seconds={-10} />
            </ButtonTooltip>
            <ButtonTooltip boundary="viewport" side="top">
              <SeekButton seconds={10} />
            </ButtonTooltip>
          </$.Controls.Group>

          <$.Controls.Group className={styles.timeSliderGroup}>
            <$.Time.Group className={timeStyles.group}>
              <$.Time.Value className={[timeStyles.toggle, timeStyles.currentValue]} type="current" toggle />
              <$.Time.Separator className={timeStyles.separator} />
              <$.Time.Value className={timeStyles.durationValue} type="duration" />
            </$.Time.Group>
            <AudioTimeSlider />
          </$.Controls.Group>

          <$.Controls.Group className={audioControlsStyles.end}>
            <VolumePopover boundary="viewport" showTooltip side="left" orientation="horizontal" />
            <AudioSettingsMenu />
          </$.Controls.Group>
        </$.Tooltip.Provider>
      </$.Controls.Content>
    </$.Controls.Root>
  );
}
