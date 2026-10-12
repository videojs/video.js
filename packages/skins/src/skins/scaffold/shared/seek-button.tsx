import * as $ from '@videojs/core/vjsc';
import { SeekIcon } from '@videojs/icons/vjsc';
import { Box, type ClassNameValue, Text } from 'vjsc/components';

import { Button } from './button';
import buttonStyles from './button.styles';
import seekButtonStyles from './seek-button.styles';
import { ButtonTooltip } from './tooltip';

/**
 * Skips playback by a fixed amount. `seconds` has to match the arrow-key hotkey the skin registers, or the engine will
 * not mirror `aria-keyshortcuts` onto the button.
 */
export function SeekButton({
  className,
  iconClassName,
  seconds,
  tooltip = true,
}: {
  className?: ClassNameValue;
  iconClassName?: ClassNameValue;
  seconds: number;
  tooltip?: boolean;
}) {
  const backward = seconds < 0;

  return (
    <ButtonTooltip disabled={!tooltip}>
      <$.SeekButton $render={Button} className={[className]} seconds={seconds}>
        <Box className={seekButtonStyles.content}>
          <SeekIcon className={[buttonStyles.icon, backward && seekButtonStyles.backwardIcon, iconClassName]} />
          <Text
            className={[
              seekButtonStyles.label,
              backward ? seekButtonStyles.backwardLabel : seekButtonStyles.forwardLabel,
            ]}
          >
            {Math.abs(seconds)}
          </Text>
        </Box>
      </$.SeekButton>
    </ButtonTooltip>
  );
}
