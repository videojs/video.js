import { PlaybackRateButtonCore, PlaybackRateButtonDataAttrs, type PlaybackRateButtonState } from '@videojs/core';
import { applyElementProps, selectPlaybackRate, type UIEvent } from '@videojs/core/dom';
import type { PropertyDeclarationMap, PropertyValues } from '@videojs/element';
import type { MediaPlaybackRateState } from '@videojs/media';

import { playerContext } from '../../player/context';
import { PlayerController } from '../../player/controller';
import { MediaButtonElement } from '../media-button-element';

export class PlaybackRateButtonElement extends MediaButtonElement<PlaybackRateButtonState, MediaPlaybackRateState> {
  static readonly tagName = 'media-playback-rate-button';

  static override properties = {
    label: { type: String },
    disabled: { type: Boolean },
    commandfor: { type: String },
    rates: { type: String },
  } satisfies PropertyDeclarationMap<'label' | 'disabled' | 'commandfor' | 'rates'>;

  commandfor: string | undefined = undefined;
  rates: readonly number[] | string | undefined = undefined;

  protected readonly core = new PlaybackRateButtonCore();
  protected readonly stateAttrMap = PlaybackRateButtonDataAttrs;
  protected readonly mediaState = new PlayerController(this, playerContext, selectPlaybackRate);
  readonly #player = new PlayerController(this, playerContext);
  protected override readonly hotkeyAction = 'speedUp';

  protected activate(state: MediaPlaybackRateState, event?: UIEvent): void {
    if (this.commandfor) {
      if (event instanceof KeyboardEvent) {
        // Custom elements do not synthesize a click from keyboard activation.
        // Dispatch one so the linked menu follows its normal open lifecycle.
        this.click();
      }

      return;
    }

    this.core.cycle(state);
  }

  protected override getIsButtonDisabled(): boolean {
    const media = this.mediaState.value;

    if (super.getIsButtonDisabled()) return true;

    if (this.commandfor && media && this.core.getRates(media).length === 0) return true;

    return false;
  }

  // A linked menu hides its trigger from the rate options' availability and
  // treats a `hidden` trigger as author-hidden, so the button must not write
  // its own pre-attach `hidden` state there.
  protected override reflectsHidden(): boolean {
    return !this.commandfor;
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    this.core.setMediaTarget(this.#player.value?.target?.media);

    if (changed.has('commandfor')) {
      if (this.commandfor) {
        this.setAttribute('commandfor', this.commandfor);
      } else {
        this.removeAttribute('commandfor');
      }
    }
  }

  protected override update(changed: PropertyValues): void {
    super.update(changed);

    const media = this.mediaState.value;
    if (!media || !this.commandfor) return;

    applyElementProps(this, {
      'aria-disabled': this.getIsButtonDisabled() ? 'true' : undefined,
    });
  }
}

export namespace PlaybackRateButtonElement {
  export type State = PlaybackRateButtonState;
}
