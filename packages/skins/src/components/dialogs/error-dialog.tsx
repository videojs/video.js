import * as $ from '@videojs/core/vjsc';
import type { ClassNameValue } from 'vjsc/components';
import { Box } from 'vjsc/components';

import type { SkinComponentDescription } from '../../meta';
import styles from '../../styles/popups/dialog.styles';
import { Button } from '../buttons/button';

type ErrorDialogPart = 'backdrop' | 'popup' | 'content' | 'title' | 'description' | 'actions' | 'close';

export interface ErrorDialogProps {
  /** Classes added after each part's own, for a skin that lays the dialog out differently. */
  classNames?: Partial<Record<ErrorDialogPart, ClassNameValue>>;
}

export function ErrorDialog({ classNames = {} }: ErrorDialogProps = {}) {
  return (
    <$.ErrorDialog.Root className={styles.root}>
      <$.ErrorDialog.Backdrop className={[styles.backdrop, classNames.backdrop]} />
      <$.ErrorDialog.Popup className={[styles.popup, classNames.popup]}>
        <Box className={[styles.content, classNames.content]}>
          <$.ErrorDialog.Title className={[styles.title, classNames.title]} />
          <$.ErrorDialog.Description className={[styles.description, classNames.description]} />
        </Box>
        <Box className={[styles.actions, classNames.actions]}>
          <$.ErrorDialog.Close $render={Button} className={[styles.close, classNames.close]} />
        </Box>
      </$.ErrorDialog.Popup>
    </$.ErrorDialog.Root>
  );
}

export const meta = {
  title: 'Error Dialog',
  description: 'An alert dialog that presents and dismisses playback errors.',
} as const satisfies SkinComponentDescription;
