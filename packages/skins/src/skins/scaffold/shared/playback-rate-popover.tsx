import { speedText } from '@videojs/core/i18n/text/menu';
import * as $ from '@videojs/core/vjsc';
import { Template, Text } from 'vjsc/components';

import popupStyles from '../../../styles/popups/popup.styles';
import { RadioItem } from './menu-item';
import menuStyles from './menu.styles';
import { PlaybackRateButton } from './rate-button';
import { ButtonTooltip } from './tooltip';

export function PlaybackRatePopover() {
  return (
    <$.Menu.Root side="top" align="center" boundary="viewport">
      <$.PlaybackRateRadioGroup.Root>
        <ButtonTooltip label={<Text token={speedText.key}>{speedText.text}</Text>}>
          <$.Menu.Trigger $render={PlaybackRateButton} />
        </ButtonTooltip>
        <$.Menu.Popup className={[popupStyles.popup, popupStyles.safeArea, menuStyles.popup, menuStyles.ratePopup]}>
          <$.Menu.Content className={menuStyles.content}>
            <$.PlaybackRateRadioGroup.Options className={menuStyles.radioGroup}>
              <Template name="playback-rate-option">
                <RadioItem>
                  <Template.Part name="label" />
                </RadioItem>
              </Template>
            </$.PlaybackRateRadioGroup.Options>
          </$.Menu.Content>
        </$.Menu.Popup>
      </$.PlaybackRateRadioGroup.Root>
    </$.Menu.Root>
  );
}
