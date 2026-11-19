import { captionsText } from '@videojs/core/i18n/text/menu';
import { CaptionsOffIcon } from '@videojs/icons/vjsc';
import { type Props, Template, Text } from 'vjsc/components';

import type { SkinComponentDescription } from '../../meta';
import styles from '../../styles/menus/menu.styles';
import { MenuChevron } from './menu-chevron';
import { RadioItem } from './radio-item';

export function CaptionsSubmenu({ ...props }: Props<MenuProps> = {}) {
  return (
    <$.Menu.Root {...props}>
      <$.CaptionsRadioGroup.Root>
        <$.Menu.Trigger className={styles.triggerItem}>
          <CaptionsOffIcon className={styles.triggerItemIcon} />
          <Text token={captionsText.key}>{captionsText.text}</Text>
          <Text className={styles.hint}>
            <$.CaptionsRadioGroup.Value className={styles.hintLabel} />
            <MenuChevron />
          </Text>
        </$.Menu.Trigger>
        <$.Menu.Content className={styles.content}>
          <$.Menu.Item className={styles.backItem}>
            <MenuChevron back />
            <Text token={captionsText.key}>{captionsText.text}</Text>
          </$.Menu.Item>
          <$.Menu.Separator className={styles.separator} />
          <$.CaptionsRadioGroup.Options className={styles.radioGroup}>
            <Template name="captions-option">
              <RadioItem>
                <Template.Part name="label" />
                <Template.Part name="badge" className={styles.badge} />
              </RadioItem>
            </Template>
          </$.CaptionsRadioGroup.Options>
        </$.Menu.Content>
      </$.CaptionsRadioGroup.Root>
    </$.Menu.Root>
  );
}
import type { MenuProps } from '@videojs/core';
import * as $ from '@videojs/core/vjsc';

export const meta = {
  title: 'Captions Submenu',
  description: 'A submenu for selecting captions or turning them off.',
} as const satisfies SkinComponentDescription;
