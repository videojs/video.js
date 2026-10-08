import * as $ from '@videojs/core/vjsc';

import popupStyles from '../../../styles/popups/popup.styles';
import { MuteButton } from './mute-button';
import { ButtonTooltip } from './tooltip';
import volumePopoverStyles from './volume-popover.styles';
import volumeSliderStyles from './volume-slider.styles';

export function VolumePopover() {
  return (
    <$.VolumePopover.Root openOnHover delay={200} closeDelay={100} side="top">
      <ButtonTooltip delay={0} disabled sticky>
        <$.VolumePopover.Trigger>
          <MuteButton />
        </$.VolumePopover.Trigger>
      </ButtonTooltip>
      <$.VolumePopover.Popup className={[popupStyles.popup, popupStyles.safeArea, volumePopoverStyles.popup]}>
        <$.VolumeSlider.Root className={volumeSliderStyles.root} orientation="vertical" thumbAlignment="edge">
          <$.VolumeSlider.Track className={volumeSliderStyles.track}>
            <$.VolumeSlider.Fill className={volumeSliderStyles.fill} />
          </$.VolumeSlider.Track>
          <$.VolumeSlider.Thumb className={volumeSliderStyles.thumb} />
        </$.VolumeSlider.Root>
      </$.VolumePopover.Popup>
    </$.VolumePopover.Root>
  );
}
