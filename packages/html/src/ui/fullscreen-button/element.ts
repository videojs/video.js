import { FullscreenButtonCore, FullscreenButtonDataAttrs, type FullscreenButtonState } from '@videojs/core';
import { type ButtonActivationSource, selectFullscreen, type UIEvent } from '@videojs/core/dom';
import { ContextConsumer } from '@videojs/element/context';
import type { MediaFullscreenState } from '@videojs/media';

import { containerContext, playerContext } from '../../player/context';
import { PlayerController } from '../../player/controller';
import { MediaButtonElement } from '../media-button-element';

export class FullscreenButtonElement extends MediaButtonElement<FullscreenButtonState, MediaFullscreenState> {
  static readonly tagName = 'media-fullscreen-button';

  protected readonly core = new FullscreenButtonCore();
  protected readonly stateAttrMap = FullscreenButtonDataAttrs;
  protected readonly mediaState = new PlayerController(this, playerContext, selectFullscreen);
  protected override readonly hotkeyAction = 'toggleFullscreen';
  readonly #container = new ContextConsumer(this, { context: containerContext, subscribe: true });

  protected activate(state: MediaFullscreenState, _event: UIEvent, source: ButtonActivationSource): Promise<void> {
    if (source === 'pointer') {
      this.#container.value?.container?.focus({ preventScroll: true });
    }

    return this.core.toggle(state);
  }
}
