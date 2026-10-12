import * as $ from '@videojs/core/vjsc';
import { ChevronIcon } from '@videojs/icons/vjsc';

import indicatorStyles from './indicator.styles';
import seekIndicatorStyles from './seek-indicator.styles';

/** Feedback for the arrow-key and double-tap seeks, shown on the side it seeks towards. */
export function SeekIndicator() {
  return (
    <$.SeekIndicator.Root className={[indicatorStyles.root, seekIndicatorStyles.root]}>
      <ChevronIcon className={seekIndicatorStyles.icon} />
      <$.SeekIndicator.Value className={seekIndicatorStyles.value} />
    </$.SeekIndicator.Root>
  );
}
