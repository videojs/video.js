import * as $ from '@videojs/core/vjsc';
import { Template } from 'vjsc/components';

import popupStyles from '../../../styles/popups/popup.styles';
import { CaptionsButton } from './captions-button';
import { RadioItem } from './menu-item';
import menuStyles from './menu.styles';
import { ButtonTooltip } from './tooltip';

export function CaptionsMenu() {
  return (
    <$.Menu.Root side="top" align="center">
      <$.CaptionsRadioGroup.Root>
        <ButtonTooltip>
          <$.Menu.Trigger $render={CaptionsButton} />
        </ButtonTooltip>
        <$.Menu.Popup className={[popupStyles.popup, popupStyles.safeArea, menuStyles.popup]}>
          <$.Menu.Content className={menuStyles.content}>
            <$.CaptionsRadioGroup.Options className={menuStyles.radioGroup}>
              <Template name="captions-option">
                <RadioItem>
                  <Template.Part name="label" />
                </RadioItem>
              </Template>
            </$.CaptionsRadioGroup.Options>
          </$.Menu.Content>
        </$.Menu.Popup>
      </$.CaptionsRadioGroup.Root>
    </$.Menu.Root>
  );
}
