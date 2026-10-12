import { badgeText } from '@videojs/core/i18n/text/live';
import * as $ from '@videojs/core/vjsc';
import { Box, Text } from 'vjsc/components';

import { Button } from './button';
import liveButtonStyles from './live-button.styles';

export function LiveButton() {
  return (
    <$.LiveButton $render={Button} className={liveButtonStyles.root}>
      <Box aria-hidden="true" className={liveButtonStyles.dot} />
      <Text token={badgeText.key}>{badgeText.text}</Text>
    </$.LiveButton>
  );
}
