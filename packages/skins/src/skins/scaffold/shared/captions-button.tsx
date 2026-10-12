import type { CaptionsButtonProps as CoreProps } from '@videojs/core';
import * as $ from '@videojs/core/vjsc';
import { CaptionsOffIcon, CaptionsOnIcon } from '@videojs/icons/vjsc';
import type { Props } from 'vjsc/components';

import { Button } from './button';
import buttonStyles from './button.styles';
import captionsButtonStyles from './captions-button.styles';
import { ButtonTooltip } from './tooltip';

export function CaptionsToggle() {
  return (
    <ButtonTooltip>
      <CaptionsButton />
    </ButtonTooltip>
  );
}

export function CaptionsButton({ className, ...props }: Props<CoreProps> = {}) {
  return (
    <$.CaptionsButton $render={Button} className={[captionsButtonStyles.root, className]} {...props}>
      <CaptionsOffIcon className={[buttonStyles.icon, captionsButtonStyles.offIcon]} />
      <CaptionsOnIcon className={[buttonStyles.icon, captionsButtonStyles.onIcon]} />
    </$.CaptionsButton>
  );
}
