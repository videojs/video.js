import type { Translator } from '../../i18n';
import { translateText } from '../../i18n';
import { exitText } from '../../i18n/text/fullscreen';
import {
  captionsOffText,
  captionsOnText,
  exitPipText,
  fullscreenText,
  pausedText,
  pipText,
  playingText,
} from '../../i18n/text/status';
import { labelText, mutedText } from '../../i18n/text/volume';

export interface InputIndicatorLabels {
  muted: string;
  volume: string;
  captionsOn: string;
  captionsOff: string;
  paused: string;
  playing: string;
  fullscreen: string;
  exitFullscreen: string;
  pictureInPicture: string;
  exitPictureInPicture: string;
}

/** @internal */
export const DEFAULT_INPUT_INDICATOR_LABELS: InputIndicatorLabels = {
  muted: translateText(mutedText),
  volume: translateText(labelText),
  captionsOn: translateText(captionsOnText),
  captionsOff: translateText(captionsOffText),
  paused: translateText(pausedText),
  playing: translateText(playingText),
  fullscreen: translateText(fullscreenText),
  exitFullscreen: translateText(exitText),
  pictureInPicture: translateText(pipText),
  exitPictureInPicture: translateText(exitPipText),
};

/**
 * Maps i18n indicator keys to {@link InputIndicatorLabels} for status / volume feedback.
 *
 * @internal
 */
export function createInputIndicatorLabels(translator: Translator): InputIndicatorLabels {
  return {
    muted: translator(mutedText),
    volume: translator(labelText),
    captionsOn: translator(captionsOnText),
    captionsOff: translator(captionsOffText),
    paused: translator(pausedText),
    playing: translator(playingText),
    fullscreen: translator(fullscreenText),
    exitFullscreen: translator(exitText),
    pictureInPicture: translator(pipText),
    exitPictureInPicture: translator(exitPipText),
  };
}
