import { ControlsCore, ControlsDataAttrs, type ControlsVisibility, POPUP_HOST_SELECTOR } from '@videojs/core';
import { applyStateDataAttrs, logMissingFeature, selectControls, selectPlayback } from '@videojs/core/dom';
import type { PropertyDeclarationMap, PropertyValues } from '@videojs/element';
import { ContextProvider } from '@videojs/element/context';
import { isFunction } from '@videojs/utils/predicate';

import { playerContext } from '../../player/context';
import { PlayerController } from '../../player/controller';
import { UIElement } from '../ui-element';
import { controlsContext } from './context';

/**
 * Tracks controls visibility and whether playback has started, reflects them as data attributes, and shares them with
 * its descendant controls parts. Hiding the controls closes any popup open inside it.
 */
export class ControlsElement extends UIElement {
  static readonly tagName = 'media-controls';

  static override properties = {
    visibility: { type: String },
  } satisfies PropertyDeclarationMap<'visibility'>;

  visibility: ControlsVisibility = ControlsCore.defaultProps.visibility;

  readonly #core = new ControlsCore();
  readonly #mediaState = new PlayerController(this, playerContext, selectControls);
  readonly #playback = new PlayerController(this, playerContext, selectPlayback);
  readonly #provider = new ContextProvider(this, { context: controlsContext });
  #visible = true;

  override connectedCallback(): void {
    super.connectedCallback();

    if (__DEV__ && this.visibility === 'auto' && !this.#mediaState.value && this.#mediaState.displayName) {
      logMissingFeature(this.localName, this.#mediaState.displayName);
    }
  }

  protected override update(_changed: PropertyValues): void {
    super.update(_changed);

    this.#core.setProps({ visibility: this.visibility });
    this.#core.setMedia(this.#mediaState.value ?? null);
    this.#core.setPlayback(this.#playback.value ?? null);

    const state = this.#core.getState();
    if (!state) return;

    applyStateDataAttrs(this, state, ControlsDataAttrs);

    this.#provider.setValue({
      state,
      stateAttrMap: ControlsDataAttrs,
    });

    const wasVisible = this.#visible;

    this.#visible = state.visible;

    if (wasVisible && !state.visible) {
      this.#closeOwnedOverlays();
    }
  }

  #closeOwnedOverlays(): void {
    for (const element of this.querySelectorAll(POPUP_HOST_SELECTOR)) {
      const host = element as Element & { close?: unknown };
      if (!isFunction(host.close)) continue;

      host.close('imperative-action');
    }
  }
}
