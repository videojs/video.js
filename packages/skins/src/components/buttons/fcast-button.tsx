import * as $ from '@videojs/core/vjsc';
import type { FCastSender } from '@videojs/fcast';
import { CastEnterIcon, CastExitIcon } from '@videojs/icons/vjsc';
import { Text } from 'vjsc/components';

import type { SkinComponentDescription } from '../../meta';
import buttonStyles from '../../styles/buttons/button.styles';
import styles from '../../styles/buttons/fcast-button.styles';
import { Button } from './button';

export interface FCastButtonProps {
  sender?: FCastSender | undefined;
  src?: string | undefined;
  contentType?: string | undefined;
}

export function FCastButton({ sender, src, contentType }: FCastButtonProps = {}) {
  return (
    <$.FCastButton $render={Button} className={styles.root} sender={sender} src={src} contentType={contentType}>
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
