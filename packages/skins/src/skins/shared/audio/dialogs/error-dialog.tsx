import { Box } from 'vjsc/components';

import { ErrorDialog } from '../../../../components/dialogs/error-dialog';
import styles from './error-dialog.styles';

export function AudioErrorDialog() {
  return (
    <Box className={styles.frame}>
      <Box className={styles.region}>
        <ErrorDialog
          classNames={{
            backdrop: [styles.backdrop],
            popup: [styles.popup],
            content: [styles.content],
            title: [styles.title],
            description: [styles.description],
            close: [styles.close],
          }}
        />
      </Box>
    </Box>
  );
}
