import * as $ from '@videojs/core/vjsc';
import { Box } from 'vjsc/components';

import { Button } from '../../../../components/buttons/button';
import styles from './error-dialog.styles';

export function AudioErrorDialog() {
  return (
    <$.ErrorDialog.Root className={styles.root}>
      <Box className={styles.frame}>
        <Box className={styles.region}>
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
        </Box>
      </Box>
    </$.ErrorDialog.Root>
  );
}
