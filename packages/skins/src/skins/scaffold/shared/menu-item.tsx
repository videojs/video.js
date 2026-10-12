import * as $ from '@videojs/core/vjsc';
import { CheckIcon } from '@videojs/icons/vjsc';
import { type PropsOf } from 'vjsc/components';

import menuStyles from './menu.styles';

export function RadioItem({ children, ...props }: PropsOf<typeof $.Menu.RadioItem>) {
  return (
    <$.Menu.RadioItem className={menuStyles.radioItem} {...props}>
      {children}
      <$.Menu.ItemIndicator forceMount className={menuStyles.indicator}>
        <CheckIcon className={menuStyles.radioIcon} />
      </$.Menu.ItemIndicator>
    </$.Menu.RadioItem>
  );
}
