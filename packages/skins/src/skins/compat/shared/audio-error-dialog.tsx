import * as $ from '@videojs/core/vjsc';
import { Box } from 'vjsc/components';

import styles from './audio-error-dialog.styles';
import { Button } from './button';

export function AudioErrorDialog() {
  return (
    <$.ErrorDialog.Root>
      <Box className={styles.frame}>
        <$.ErrorDialog.Backdrop className={styles.backdrop} />
        <$.ErrorDialog.Popup className={styles.popup}>
          <Box className={styles.content}>
            <$.ErrorDialog.Title className={styles.title} />
            <$.ErrorDialog.Description className={styles.description} />
          </Box>
          <$.ErrorDialog.Close $render={Button} className={styles.close} />
        </$.ErrorDialog.Popup>
      </Box>
    </$.ErrorDialog.Root>
  );
}
