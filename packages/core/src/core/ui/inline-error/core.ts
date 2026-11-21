import type { MediaErrorState } from '@videojs/media';

import type { Text } from '../../i18n';
import { resolveErrorDialogDescription } from '../error-dialog/i18n';

/**
 * The player state an inline error reads.
 *
 * @internal
 */
export type InlineErrorMediaState = Pick<MediaErrorState, 'error'>;

/** @internal */
export interface InlineErrorState {
  /** Whether a playback error is showing. */
  visible: boolean;
}

/**
 * A non-modal playback error shown in place over the media, without the dismissal or focus handling of the error
 * dialog.
 *
 * Keeps the last error after it clears so a binding can animate the message out with its content intact.
 *
 * @internal
 */
export class InlineErrorCore {
  #error: MediaErrorState['error'] = null;
  #lastError: MediaErrorState['error'] = null;

  /** Supply the latest player state. Call before reading {@link InlineErrorCore.getState}. */
  setMedia(media: InlineErrorMediaState): void {
    this.#error = media.error;

    if (media.error) this.#lastError = media.error;
  }

  getState(): InlineErrorState {
    return { visible: Boolean(this.#error) };
  }

  /** Message for the current error, or for the last one while the binding animates it out. */
  getDescription(): Text | string {
    return resolveErrorDialogDescription(this.#lastError);
  }
}

/** @internal */
export namespace InlineErrorCore {
  export type State = InlineErrorState;
  export type MediaState = InlineErrorMediaState;
}
