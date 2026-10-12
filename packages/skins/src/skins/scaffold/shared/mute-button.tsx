import * as $ from '@videojs/core/vjsc';
import { VolumeHighIcon, VolumeOffIcon } from '@videojs/icons/vjsc';
import { type PropsOf } from 'vjsc/components';

import { Button } from './button';
import buttonStyles from './button.styles';
import muteButtonStyles from './mute-button.styles';

export function MuteButton({ className, ...props }: PropsOf<typeof $.MuteButton> = {}) {
  return (
    <$.MuteButton $render={Button} className={[muteButtonStyles.root, className]} {...props}>
      <VolumeOffIcon className={[buttonStyles.icon, muteButtonStyles.offIcon]} />
      <VolumeHighIcon className={[buttonStyles.icon, muteButtonStyles.highIcon]} />
    </$.MuteButton>
  );
}
