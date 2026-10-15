import * as $ from '@videojs/core/vjsc';
import { CastEnterIcon, CastExitIcon } from '@videojs/icons/vjsc';
import { Text } from 'vjsc/components';

import type { SkinComponentDescription } from '../../meta';
import buttonStyles from '../../styles/buttons/button.styles';
import styles from '../../styles/buttons/fcast-button.styles';
import { Button } from './button';

export function FCastButton() {
  return (
    <$.FCastButton $render={Button} className={styles.root}>
      <CastEnterIcon className={[buttonStyles.icon, styles.enterIcon]} />
      <CastExitIcon className={[buttonStyles.icon, styles.exitIcon]} />
      <Text aria-hidden="true" className={styles.badge}>
        F
      </Text>
    </$.FCastButton>
  );
}

export const meta = {
  title: 'FCast Button',
  description: 'A state-aware button for an application-provided FCast sender.',
} as const satisfies SkinComponentDescription;
