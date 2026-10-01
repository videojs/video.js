import { safeDefine } from '../../registration/safe-define';
import {
  defineErrorDialog,
  defineMenu,
  defineTime,
  defineTimeSlider,
  defineTooltip,
  defineVolumeSlider,
} from '../../registration/ui-compounds';
// Registers the container and all audio UI custom elements
// used by the neutral skin without creating a skin element. Use this entry
// when building an ejected (light DOM) player layout.
import { BufferingIndicatorElement } from '../../ui/buffering-indicator/element';
import { ContainerElement } from '../../ui/container/element';
import { HotkeyElement } from '../../ui/hotkey/element';
import { MuteButtonElement } from '../../ui/mute-button/element';
import { PlayButtonElement } from '../../ui/play-button/element';
import { PlaybackRateButtonElement } from '../../ui/playback-rate-button/element';
import { PlaybackRateRadioGroupElement } from '../../ui/playback-rate-radio-group/element';
import { PopoverElement } from '../../ui/popover/element';
import { SeekButtonElement } from '../../ui/seek-button/element';
// ── Registration (providers / parents first) ────────────────────────────

safeDefine(ContainerElement);

// Compound groups.
defineErrorDialog();
defineTimeSlider();
defineVolumeSlider();
defineTime();
defineMenu();
defineTooltip();

// Standalone elements.
safeDefine(BufferingIndicatorElement);
safeDefine(HotkeyElement);
safeDefine(MuteButtonElement);
safeDefine(PlayButtonElement);
safeDefine(PlaybackRateButtonElement);
safeDefine(PlaybackRateRadioGroupElement);
safeDefine(PopoverElement);
safeDefine(SeekButtonElement);
