import * as $ from '@videojs/core/vjsc';
import { Box } from 'vjsc/components';

import type { SkinComponentDescription } from '../../meta';
import styles from '../../styles/popups/dialog.styles';
import { Button } from '../buttons/button';

export function ErrorDialog() {
  return (
    <$.ErrorDialog.Root className={styles.root}>
      <$.ErrorDialog.Backdrop className={styles.backdrop} />
      <$.ErrorDialog.Popup className={styles.popup}>
        <Box className={styles.content}>
          <$.ErrorDialog.Title className={styles.title} />
          <$.ErrorDialog.Description className={styles.description} />
        </Box>
        <Box className={styles.actions}>
          <$.ErrorDialog.Close $render={Button} className={styles.close} />
        </Box>
      </$.ErrorDialog.Popup>
    </$.ErrorDialog.Root>
  );
}

export const meta = {
  title: 'Error Dialog',
  description: 'An alert dialog that presents and dismisses playback errors.',
} as const satisfies SkinComponentDescription;
