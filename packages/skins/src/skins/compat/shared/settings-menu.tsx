import { audioText, captionsText, qualityText, settingsText, speedText } from '@videojs/core/i18n/text/menu';
import * as $ from '@videojs/core/vjsc';
import { CaptionsOffIcon, ChevronIcon, GearIcon, SpeechIcon, SpeedIcon, SwitchesIcon } from '@videojs/icons/vjsc';
import { Template, Text } from 'vjsc/components';

import popupStyles from '../../../styles/popups/popup.styles';
import { Button } from './button';
import buttonStyles from './button.styles';
import { RadioItem } from './menu-item';
import menuStyles from './menu.styles';
import settingsButtonStyles from './settings-button.styles';
import { ButtonTooltip } from './tooltip';

function MenuChevron({ back = false }: { back?: boolean } = {}) {
  return <ChevronIcon className={back ? menuStyles.backChevron : menuStyles.forwardChevron} />;
}

function QualityMenu() {
  return (
    <$.Menu.Root>
      <$.QualityRadioGroup.Root>
        <$.Menu.Trigger className={menuStyles.item}>
          <SwitchesIcon className={menuStyles.triggerIcon} />
          <Text token={qualityText.key}>{qualityText.text}</Text>
          <Text className={menuStyles.hint}>
            <$.QualityRadioGroup.Value className={menuStyles.hintLabel} />
            <MenuChevron />
          </Text>
        </$.Menu.Trigger>
        <$.Menu.Content className={menuStyles.content}>
          <$.Menu.Item className={menuStyles.backItem}>
            <MenuChevron back />
            <Text token={qualityText.key}>{qualityText.text}</Text>
          </$.Menu.Item>
          <$.Menu.Separator className={menuStyles.separator} />
          <$.QualityRadioGroup.Options className={menuStyles.radioGroup}>
            <Template name="quality-option">
              <RadioItem>
                <Text>
                  <Template.Part name="label" />
                  <Template.Part name="tier" className={menuStyles.tier} />
                </Text>
                <Template.Part name="badge" className={menuStyles.badge} />
              </RadioItem>
            </Template>
          </$.QualityRadioGroup.Options>
        </$.Menu.Content>
      </$.QualityRadioGroup.Root>
    </$.Menu.Root>
  );
}

function AudioTrackMenu() {
  return (
    <$.Menu.Root>
      <$.AudioTrackRadioGroup.Root>
        <$.Menu.Trigger className={menuStyles.item}>
          <SpeechIcon className={menuStyles.triggerIcon} />
          <Text token={audioText.key}>{audioText.text}</Text>
          <Text className={menuStyles.hint}>
            <$.AudioTrackRadioGroup.Value className={menuStyles.hintLabel} />
            <MenuChevron />
          </Text>
        </$.Menu.Trigger>
        <$.Menu.Content className={menuStyles.content}>
          <$.Menu.Item className={menuStyles.backItem}>
            <MenuChevron back />
            <Text token={audioText.key}>{audioText.text}</Text>
          </$.Menu.Item>
          <$.Menu.Separator className={menuStyles.separator} />
          <$.AudioTrackRadioGroup.Options className={menuStyles.radioGroup}>
            <Template name="audio-track-option">
              <RadioItem>
                <Template.Part name="label" />
              </RadioItem>
            </Template>
          </$.AudioTrackRadioGroup.Options>
        </$.Menu.Content>
      </$.AudioTrackRadioGroup.Root>
    </$.Menu.Root>
  );
}

function PlaybackRateMenu() {
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

function CaptionsMenu() {
  return (
    <$.Menu.Root>
      <$.CaptionsRadioGroup.Root>
        <$.Menu.Trigger className={menuStyles.item}>
          <CaptionsOffIcon className={menuStyles.triggerIcon} />
          <Text token={captionsText.key}>{captionsText.text}</Text>
          <Text className={menuStyles.hint}>
            <$.CaptionsRadioGroup.Value className={menuStyles.hintLabel} />
            <MenuChevron />
          </Text>
        </$.Menu.Trigger>
        <$.Menu.Content className={menuStyles.content}>
          <$.Menu.Item className={menuStyles.backItem}>
            <MenuChevron back />
            <Text token={captionsText.key}>{captionsText.text}</Text>
          </$.Menu.Item>
          <$.Menu.Separator className={menuStyles.separator} />
          <$.CaptionsRadioGroup.Options className={menuStyles.radioGroup}>
            <Template name="captions-option">
              <RadioItem>
                <Template.Part name="label" />
              </RadioItem>
            </Template>
          </$.CaptionsRadioGroup.Options>
        </$.Menu.Content>
      </$.CaptionsRadioGroup.Root>
    </$.Menu.Root>
  );
}

export function SettingsMenu() {
  return (
    <$.Menu.Root side="top" align="center">
      <ButtonTooltip label={<Text token={settingsText.key}>{settingsText.text}</Text>}>
        <$.Menu.Trigger $render={Button} className={settingsButtonStyles.root}>
          <GearIcon className={[buttonStyles.icon, settingsButtonStyles.icon]} />
          <Text className={settingsButtonStyles.label} token={settingsText.key}>
            {settingsText.text}
          </Text>
        </$.Menu.Trigger>
      </ButtonTooltip>
      <$.Menu.Popup
        keepMounted
        className={[popupStyles.popup, popupStyles.safeArea, menuStyles.popup, menuStyles.resizablePopup]}
      >
        <$.Menu.Content className={menuStyles.content}>
          <QualityMenu />
          <AudioTrackMenu />
          <PlaybackRateMenu />
          <CaptionsMenu />
        </$.Menu.Content>
      </$.Menu.Popup>
    </$.Menu.Root>
  );
}
