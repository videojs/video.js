import * as $ from '@videojs/core/vjsc';

import { Button } from './button';
import dialogStyles from './dialog.styles';

export function ErrorDialog() {
  return (
    <$.ErrorDialog.Root>
      <$.ErrorDialog.Backdrop className={dialogStyles.backdrop} />
      <$.ErrorDialog.Popup className={dialogStyles.popup}>
        <$.ErrorDialog.Title className={dialogStyles.title} />
        <$.ErrorDialog.Description className={dialogStyles.description} />
        <$.ErrorDialog.Close $render={Button} className={dialogStyles.close} />
      </$.ErrorDialog.Popup>
    </$.ErrorDialog.Root>
  );
}
