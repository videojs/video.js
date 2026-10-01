import * as $ from '@videojs/core/vjsc';
import { PauseIcon, PlayIcon, RestartIcon } from '@videojs/icons/vjsc';
import { type ClassNameValue, type PropsOf } from 'vjsc/components';

import { Button } from './button';
import buttonStyles from './button.styles';
import playButtonStyles from './play-button.styles';
import { ButtonTooltip } from './tooltip';

export function PlayButton({
  className,
  iconClassName,
  tooltip = true,
  ...props
}: PropsOf<typeof $.PlayButton> & { iconClassName?: ClassNameValue; tooltip?: boolean } = {}) {
  return (
    <ButtonTooltip disabled={!tooltip}>
      <$.PlayButton $render={Button} className={[playButtonStyles.root, className]} {...props}>
        <RestartIcon className={[buttonStyles.iconBase, playButtonStyles.restartIcon, iconClassName]} />
        <PlayIcon className={[buttonStyles.iconBase, playButtonStyles.playIcon, iconClassName]} />
        <PauseIcon className={[buttonStyles.iconBase, playButtonStyles.pauseIcon, iconClassName]} />
      </$.PlayButton>
    </ButtonTooltip>
  );
}
