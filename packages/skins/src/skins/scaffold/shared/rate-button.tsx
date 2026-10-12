import * as $ from '@videojs/core/vjsc';
import { type PropsOf } from 'vjsc/components';

import { Button } from './button';
import playbackRateButtonStyles from './playback-rate-button.styles';

export function PlaybackRateButton({ className, ...props }: PropsOf<typeof $.PlaybackRateButton> = {}) {
  return (
    <$.PlaybackRateButton $render={Button} className={[playbackRateButtonStyles.root, className]} {...props}>
      <$.PlaybackRateRadioGroup.Value />
    </$.PlaybackRateButton>
  );
}
