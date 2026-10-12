import * as $ from '@videojs/core/vjsc';
import { AirPlayEnterIcon, AirPlayExitIcon } from '@videojs/icons/vjsc';
import type { ClassNameValue } from 'vjsc/components';

import airplayButtonStyles from './airplay-button.styles';
import { Button } from './button';
import buttonStyles from './button.styles';
import { ButtonTooltip } from './tooltip';

export function AirPlayButton({ popupClassName }: { popupClassName?: ClassNameValue } = {}) {
  return (
    <ButtonTooltip popupClassName={popupClassName}>
      <$.AirPlayButton $render={Button} className={airplayButtonStyles.root}>
        <AirPlayEnterIcon className={[buttonStyles.icon, airplayButtonStyles.enterIcon]} />
        <AirPlayExitIcon className={[buttonStyles.icon, airplayButtonStyles.exitIcon]} />
      </$.AirPlayButton>
    </ButtonTooltip>
  );
}
