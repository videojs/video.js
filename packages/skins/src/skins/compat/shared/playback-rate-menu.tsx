import { speedText } from '@videojs/core/i18n/text/menu';
import * as $ from '@videojs/core/vjsc';
import { SpeedIcon } from '@videojs/icons/vjsc';
import { Template, Text } from 'vjsc/components';

import { RadioItem } from './menu-item';
import menuStyles from './menu.styles';
import { MenuChevron } from './settings-menu';

export function PlaybackRateMenu() {
  return (
    <$.Menu.Root>
      <$.PlaybackRateRadioGroup.Root>
        <$.Menu.Trigger className={menuStyles.item}>
          <SpeedIcon className={menuStyles.triggerIcon} />
          <Text token={speedText.key}>{speedText.text}</Text>
          <Text className={menuStyles.hint}>
            <$.PlaybackRateRadioGroup.Value className={menuStyles.hintLabel} />
            <MenuChevron />
          </Text>
        </$.Menu.Trigger>
        <$.Menu.Content className={menuStyles.content}>
          <$.Menu.Item className={menuStyles.backItem}>
            <MenuChevron back />
            <Text token={speedText.key}>{speedText.text}</Text>
          </$.Menu.Item>
          <$.Menu.Separator className={menuStyles.separator} />
          <$.PlaybackRateRadioGroup.Options className={menuStyles.radioGroup}>
            <Template name="playback-rate-option">
              <RadioItem>
                <Template.Part name="label" />
              </RadioItem>
            </Template>
          </$.PlaybackRateRadioGroup.Options>
        </$.Menu.Content>
      </$.PlaybackRateRadioGroup.Root>
    </$.Menu.Root>
  );
}
