import * as $ from '@videojs/core/vjsc';
import { CastEnterIcon, CastExitIcon } from '@videojs/icons/vjsc';
import { Text } from 'vjsc/components';

import fcastStyles from '../../../styles/buttons/fcast-button.styles';
import { Button } from './button';
import buttonStyles from './button.styles';
import { ButtonTooltip } from './tooltip';
import tooltipStyles from './tooltip.styles';

export function FCastButton() {
  return (
    <ButtonTooltip popupClassName={tooltipStyles.screenPopup}>
      <$.FCastButton $render={Button} className={fcastStyles.root}>
        <CastEnterIcon className={[buttonStyles.icon, fcastStyles.enterIcon]} />
        <CastExitIcon className={[buttonStyles.icon, fcastStyles.exitIcon]} />
        <Text aria-hidden="true" className={fcastStyles.badge}>
          F
        </Text>
      </$.FCastButton>
    </ButtonTooltip>
  );
}
