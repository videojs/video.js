import { safeDefine } from '../../registration/safe-define';
import {
  defineControls,
  defineErrorDialog,
  defineInputIndicators,
  defineMenu,
  defineTime,
  defineTimeSlider,
  defineTooltip,
  defineVolumeSlider,
} from '../../registration/ui-compounds';
// Registers the container and all live video UI custom
// elements used by the neutral skin without creating a skin element. Use
// this entry when building an ejected (light DOM) player layout for live
// HLS / DASH streams.
import { AirPlayButtonElement } from '../../ui/airplay-button/element';
import { BufferingIndicatorElement } from '../../ui/buffering-indicator/element';
import { CaptionsButtonElement } from '../../ui/captions-button/element';
import { CaptionsRadioGroupElement } from '../../ui/captions-radio-group/element';
import { CastButtonElement } from '../../ui/cast-button/element';
import { ContainerElement } from '../../ui/container/element';
import { FullscreenButtonElement } from '../../ui/fullscreen-button/element';
import { GestureElement } from '../../ui/gesture/element';
import { HotkeyElement } from '../../ui/hotkey/element';
import { LiveButtonElement } from '../../ui/live-button/element';
import { MuteButtonElement } from '../../ui/mute-button/element';
import { PiPButtonElement } from '../../ui/pip-button/element';
import { PlayButtonElement } from '../../ui/play-button/element';
import { PopoverElement } from '../../ui/popover/element';
import { PosterElement } from '../../ui/poster/element';
// ── Registration (providers / parents first) ────────────────────────────

safeDefine(ContainerElement);

// Compound groups.
defineControls();
defineErrorDialog();
defineInputIndicators();
defineTimeSlider();
defineVolumeSlider();
defineTime();
defineMenu();
defineTooltip();

// Standalone elements.
safeDefine(AirPlayButtonElement);
safeDefine(BufferingIndicatorElement);
safeDefine(CaptionsButtonElement);
safeDefine(CaptionsRadioGroupElement);
safeDefine(CastButtonElement);
safeDefine(FullscreenButtonElement);
safeDefine(GestureElement);
safeDefine(HotkeyElement);
safeDefine(LiveButtonElement);
safeDefine(MuteButtonElement);
safeDefine(PiPButtonElement);
safeDefine(PlayButtonElement);
safeDefine(PopoverElement);
safeDefine(PosterElement);
