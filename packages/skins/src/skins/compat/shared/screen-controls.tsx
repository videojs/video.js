import * as $ from '@videojs/core/vjsc';
import type { FCastSender } from '@videojs/fcast';
import {
  CastEnterIcon,
  CastExitIcon,
  FullscreenEnterIcon,
  FullscreenExitIcon,
  PipEnterIcon,
  PipExitIcon,
} from '@videojs/icons/vjsc';

import { AirPlayButton } from './airplay-button';
import { Button } from './button';
import buttonStyles from './button.styles';
import castButtonStyles from './cast-button.styles';
import { FCastButton } from './fcast-button';
import fullscreenButtonStyles from './fullscreen-button.styles';
import pipButtonStyles from './pip-button.styles';
import { ButtonTooltip } from './tooltip';
import tooltipStyles from './tooltip.styles';

function CastButton() {
  return (
    <ButtonTooltip popupClassName={tooltipStyles.screenPopup}>
      <$.CastButton $render={Button} className={castButtonStyles.root}>
        <CastEnterIcon className={[buttonStyles.icon, castButtonStyles.enterIcon]} />
        <CastExitIcon className={[buttonStyles.icon, castButtonStyles.exitIcon]} />
      </$.CastButton>
    </ButtonTooltip>
  );
}

function PiPButton() {
  return (
    <ButtonTooltip popupClassName={tooltipStyles.screenPopup}>
      <$.PiPButton $render={Button} className={pipButtonStyles.root}>
        <PipEnterIcon className={[buttonStyles.icon, pipButtonStyles.enterIcon]} />
        <PipExitIcon className={[buttonStyles.icon, pipButtonStyles.exitIcon]} />
      </$.PiPButton>
    </ButtonTooltip>
  );
}

function FullscreenButton() {
  return (
    <ButtonTooltip popupClassName={tooltipStyles.screenPopup}>
      <$.FullscreenButton $render={Button} className={fullscreenButtonStyles.root}>
        <FullscreenEnterIcon className={[buttonStyles.icon, fullscreenButtonStyles.enterIcon]} />
        <FullscreenExitIcon className={[buttonStyles.icon, fullscreenButtonStyles.exitIcon]} />
      </$.FullscreenButton>
    </ButtonTooltip>
  );
}

export function ScreenControls({
  fcast,
}: {
  fcast?:
    | {
        sender?: FCastSender | undefined;
        src?: string | undefined;
        contentType?: string | undefined;
      }
    | undefined;
} = {}) {
  return (
    <>
      <AirPlayButton popupClassName={tooltipStyles.screenPopup} />
      <CastButton />
      <FCastButton {...fcast} />
      <PiPButton />
      <FullscreenButton />
    </>
  );
}
