import { safeDefine } from '../../registration/safe-define';
import {
  defineErrorDialog,
  defineTime,
  defineTimeSlider,
  defineTooltip,
  defineVolumeSlider,
} from '../../registration/ui-compounds';
// Registers the container and all live audio UI custom
// elements used by the neutral skin without creating a skin element. Use
// this entry when building an ejected (light DOM) player layout for live
// HLS / DASH streams.
import { BufferingIndicatorElement } from '../../ui/buffering-indicator/element';
import { ContainerElement } from '../../ui/container/element';
import { HotkeyElement } from '../../ui/hotkey/element';
import { LiveButtonElement } from '../../ui/live-button/element';
import { MuteButtonElement } from '../../ui/mute-button/element';
import { PlayButtonElement } from '../../ui/play-button/element';
import { PopoverElement } from '../../ui/popover/element';
// ── Registration (providers / parents first) ────────────────────────────

safeDefine(ContainerElement);

// Compound groups.
defineErrorDialog();
defineTimeSlider();
defineVolumeSlider();
defineTime();
defineTooltip();

// Standalone elements.
safeDefine(BufferingIndicatorElement);
safeDefine(HotkeyElement);
safeDefine(LiveButtonElement);
safeDefine(MuteButtonElement);
safeDefine(PlayButtonElement);
safeDefine(PopoverElement);
