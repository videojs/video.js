import * as $ from '@videojs/core/vjsc';
import type { FCastSender } from '@videojs/fcast';
import { CastEnterIcon, CastExitIcon } from '@videojs/icons/vjsc';
import { Text } from 'vjsc/components';

import fcastStyles from '../../../styles/buttons/fcast-button.styles';
import { Button } from './button';
import buttonStyles from './button.styles';
import { ButtonTooltip } from './tooltip';
import tooltipStyles from './tooltip.styles';

export function FCastButton({
  sender,
  src,
  contentType,
}: {
  sender?: FCastSender | undefined;
  src?: string | undefined;
  contentType?: string | undefined;
} = {}) {
  return (
    <ButtonTooltip popupClassName={tooltipStyles.screenPopup}>
      <$.FCastButton $render={Button} className={fcastStyles.root} sender={sender} src={src} contentType={contentType}>
        <CastEnterIcon className={[buttonStyles.icon, fcastStyles.enterIcon]} />
        <CastExitIcon className={[buttonStyles.icon, fcastStyles.exitIcon]} />
        <Text aria-hidden="true" className={fcastStyles.badge}>
          F
        </Text>
      </$.FCastButton>
    </ButtonTooltip>
  );
}
